import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lab from "@/models/Lab";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
    try {
        await dbConnect();
        const labs = await Lab.find({}).sort({ name: 1 });
        return NextResponse.json(labs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description } = await req.json();
        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        await dbConnect();
        const newLab = await Lab.create({ name, description });
        return NextResponse.json(newLab, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
