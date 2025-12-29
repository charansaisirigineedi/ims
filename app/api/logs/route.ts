import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UsageLog from "@/models/UsageLog";
import Item from "@/models/Item";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get("itemId");
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        let query: any = {};
        if (itemId) query.item_id = itemId;

        if (status && status !== 'all') {
            query.status = status;
        } else if (!status) {
            query.status = 'pending';
        }

        const total = await UsageLog.countDocuments(query);
        const logs = await UsageLog.find(query)
            .populate("item_id")
            .populate("user_id", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            logs,
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

        // Support both single entry and bulk array
        if (Array.isArray(body)) {
            const logs = body.map(entry => ({
                ...entry,
                user_id: (session!.user as any).id,
                status: 'pending'
            }));
            const result = await UsageLog.insertMany(logs);
            return NextResponse.json(result, { status: 201 });
        } else {
            const log = await UsageLog.create({
                ...body,
                user_id: session.user.id,
                status: 'pending'
            });
            return NextResponse.json(log, { status: 201 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { session, errorResponse } = await validateRequest();
        if (errorResponse) return errorResponse;

        if ((session!.user as any).role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { logId, status, quantity } = await request.json();

        const log = await UsageLog.findById(logId);
        if (!log) return NextResponse.json({ error: "Log not found" }, { status: 404 });

        // Update quantity if provided (useful for receiving goods)
        if (quantity !== undefined) {
            log.quantity = quantity;
        }

        if (status === 'approved') {
            const item = await Item.findById(log.item_id);
            if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

            if (log.type === 'subtract') {
                item.quantity -= log.quantity;
            } else {
                item.quantity += log.quantity;
            }
            await item.save();
        }

        log.status = status;
        log.approved_by = session.user.id;
        await log.save();

        return NextResponse.json(log);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
