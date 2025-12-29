import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";
import Lab from "@/models/Lab";

export async function GET() {
    try {
        await dbConnect();

        const totalItems = await Item.countDocuments({ status: 'active' });

        const lowStockItems = await Item.countDocuments({
            status: 'active',
            $expr: { $lte: ["$quantity", "$minStock"] }
        });

        const expiringSoon = await Item.countDocuments({
            status: 'active',
            expiryDate: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
        });

        // Lab-wise breakdown
        const labs = await Lab.find({}, 'name');
        const labBreakdown = await Promise.all(labs.map(async (lab) => {
            const count = await Item.countDocuments({ lab_id: lab._id, status: 'active' });
            return { name: lab.name, count };
        }));

        return NextResponse.json({
            totalItems,
            lowStockItems,
            expiringSoon,
            labBreakdown
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
