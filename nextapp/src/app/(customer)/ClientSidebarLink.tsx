"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  href: string;
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
}

export default function ClientSidebarLink({ href, icon, label, children }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const s = {
    purpleLight: "#a78bfa",
    purpleMuted: "rgba(124,58,237,0.12)",
    muted: "#6b7280",
    text: "#e5e7eb",
  };

  return (
    <Link 
      href={href} 
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "12px", 
        padding: "11px 14px", 
        borderRadius: "10px", 
        background: isActive ? s.purpleMuted : "transparent", 
        color: isActive ? s.purpleLight : s.text, 
        border: isActive ? `1px solid rgba(124,58,237,0.2)` : `1px solid transparent`,
        fontSize: "14px", 
        fontWeight: isActive ? 600 : 500,
        textDecoration: "none",
        transition: "all 0.2s"
      }}
    >
      {icon} {label}
      {children}
    </Link>
  );
}
