"use client";
import { FrontendRoutes } from "@/config/apiRoutes";
import { redirect } from "next/navigation";

export default function Home() {
  redirect(FrontendRoutes.DENTIST_LIST);
}
