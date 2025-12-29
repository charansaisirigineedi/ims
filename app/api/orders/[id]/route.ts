import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Item from "@/models/Item";
import UsageLog from "@/models/UsageLog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const order = await Order.findById(params.id)
            .populate("user_id", "name")
            .populate("items.item_id")
            .populate("completed_by", "name");

        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        // RBAC: Non-admins can only see their own orders
        const isAdmin = (session.user as any).role === 'admin';
        if (!isAdmin && order.user_id._id.toString() !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(order);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { validateRequest } from "@/lib/auth-utils";

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { session, errorResponse } = await validateRequest();
        if (errorResponse) return errorResponse;

        if ((session!.user as any).role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { items: updatedItems, status } = await request.json();

        const order = await Order.findById(params.id);
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        if (status === 'completed' && order.status !== 'completed') {
            // Process fulfillment
            for (const itemUpdate of updatedItems) {
                const orderItem = order.items.find((i: any) => i.item_id.toString() === itemUpdate.item_id);
                if (!orderItem) continue;

                // Update order record with actual received/confirmed quantity
                orderItem.received_qty = itemUpdate.received_qty;

                // Update main inventory
                const item = await Item.findById(itemUpdate.item_id);
                if (item) {
                    const delta = order.type === 'purchase'
                        ? itemUpdate.received_qty
                        : (itemUpdate.received_qty - item.quantity); // For audits, received_qty is the new total

                    item.quantity += delta;
                    await item.save();

                    // Log individual transaction for audit history
                    await UsageLog.create({
                        item_id: item._id,
                        user_id: session.user.id,
                        quantity: Math.abs(delta),
                        type: delta >= 0 ? 'add' : 'subtract',
                        reason: order.type === 'purchase' ? `BATCH_PO_${order._id}` : `BATCH_AUDIT_${order._id}`,
                        status: 'approved',
                        approved_by: session.user.id
                    });
                }
            }
            order.status = 'completed';
            order.completed_at = new Date();
            order.completed_by = session.user.id;
        } else if (status === 'cancelled') {
            order.status = 'cancelled';
        }

        await order.save();
        return NextResponse.json(order);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
