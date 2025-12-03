"use client";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { logout } from "@/lib/loginManager";
import { LockOpenIcon } from "lucide-react";

export default function LogoutButton() {
    return (
        <SidebarMenuButton onClick={logout}>
            <LockOpenIcon />
            Log out
        </SidebarMenuButton>
    )
}