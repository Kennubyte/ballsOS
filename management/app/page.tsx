"use client";

import ResourceCard from "@/components/custom/home/ResourceCard";

export default function Home() {
  return (
    <div className="p-4 w-full">
      <h1 className="text-3xl mb-3 font-bold">Welcome to ballsOS Management</h1>
      <div>
        <ResourceCard />
      </div>
    </div>
  );
}
