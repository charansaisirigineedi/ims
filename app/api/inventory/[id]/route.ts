import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const item = await Item.findById(params.id)
            .populate("lab_id", "name")
            .populate("category_id", "name");
        if (!item) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        return NextResponse.json(item);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const body = await request.json();
        const item = await Item.findByIdAndUpdate(params.id, body, { new: true });
        if (!item) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        return NextResponse.json(item);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const item = await Item.findByIdAndDelete(params.id);
        if (!item) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        return NextResponse.json({ message: "Asset deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
