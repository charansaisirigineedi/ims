import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";
import Lab from "@/models/Lab";
import Category from "@/models/Category";

export async function GET(request: Request) {
    try {
        await dbConnect();

        // Ensure labs and categories are registered in Mongoose
        await Lab.find().limit(1);
        await Category.find().limit(1);

        const { searchParams } = new URL(request.url);
        const labId = searchParams.get("labId");
        const categoryId = searchParams.get("categoryId");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        let query: any = {};
        if (labId) query.lab_id = labId;
        if (categoryId) query.category_id = categoryId;
        if (search) query.name = { $regex: search, $options: "i" };

        const total = await Item.countDocuments(query);
        const items = await Item.find(query)
            .populate("lab_id", "name")
            .populate("category_id", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            items,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const item: any = await Item.create(body);
        const itemId = Array.isArray(item) ? item[0]._id : item._id;
        const populatedItem = await Item.findById(itemId).populate(["lab_id", "category_id"]);
        return NextResponse.json(populatedItem, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
