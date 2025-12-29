import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";

export async function GET() {
    try {
        await dbConnect();

        // Find items where quantity is less than or equal to minStock
        const items = await Item.find({
            status: 'active',
            $expr: { $lte: ["$quantity", "$minStock"] }
        })
            .populate("lab_id", "name")
            .populate("category_id", "name");

        return NextResponse.json(items);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
