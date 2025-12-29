import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        let query: any = {};
        if (type && type !== 'all') query.type = type;
        if (status && status !== 'all') query.status = status;

        // RBAC: Non-admins can only see their own orders
        const isAdmin = (session.user as any).role === 'admin';
        if (!isAdmin) {
            query.user_id = session.user.id;
        }

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate("user_id", "name email")
            .populate("items.item_id", "name unit")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            orders,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { validateRequest } from "@/lib/auth-utils";

export async function POST(request: Request) {
    try {
        const { session, errorResponse } = await validateRequest();
        if (errorResponse) return errorResponse;

        await dbConnect();
        const body = await request.json();

        const order = await Order.create({
            ...body,
            user_id: (session!.user as any).id,
            status: body.type === 'purchase' ? 'requested' : 'pending'
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
