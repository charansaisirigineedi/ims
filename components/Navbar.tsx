"use client";

import { useSession } from "next-auth/react";
import AdminNavbar from "./AdminNavbar";
import UserNavbar from "./UserNavbar";

export default function Navbar() {
    const { data: session } = useSession();

    if (!session) {
        return <UserNavbar />;
    }

    // Check if user is admin
    const isAdmin = (session.user as any).role === 'admin';

    return isAdmin ? <AdminNavbar /> : <UserNavbar />;
}
