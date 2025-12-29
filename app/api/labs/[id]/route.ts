import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lab from "@/models/Lab";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const lab = await Lab.findById(params.id);
        if (!lab) {
            return NextResponse.json({ error: "Lab not found" }, { status: 404 });
        }
        return NextResponse.json(lab);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description } = await req.json();
        await dbConnect();
        const updatedLab = await Lab.findByIdAndUpdate(
            params.id,
            { name, description },
            { new: true, runValidators: true }
        );

        if (!updatedLab) {
            return NextResponse.json({ error: "Lab not found" }, { status: 404 });
        }

        return NextResponse.json(updatedLab);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const deletedLab = await Lab.findByIdAndDelete(params.id);

        if (!deletedLab) {
            return NextResponse.json({ error: "Lab not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Lab deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
