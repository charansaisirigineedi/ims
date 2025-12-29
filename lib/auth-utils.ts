import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function validateRequest() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
        return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    await dbConnect();
    const user = await User.findById((session.user as any).id);

    if (!user) {
        return { errorResponse: NextResponse.json({ error: "User session invalid. Please relogin." }, { status: 401 }) };
    }

    return { session, user };
}
