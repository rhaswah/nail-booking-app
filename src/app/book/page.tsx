import type { Metadata } from "next";
import BookingWizard from "@/components/booking/booking-wizard";
import { getProvider } from "@/lib/booking/provider";
import { salonConfig } from "@/lib/salon.config";

export const metadata: Metadata = {
  title: `Book an appointment — ${salonConfig.name}`,
  description: `Pick your services, artist, and time at ${salonConfig.name} in under a minute.`,
};

// Catalog comes from the provider at request time (mock now, byChronos later).
export const dynamic = "force-dynamic";

export default async function BookPage() {
  const provider = getProvider();
  const [categories, services, staff] = await Promise.all([
    provider.getCategories(),
    provider.getServices(),
    provider.getStaff(),
  ]);

  return (
    <BookingWizard categories={categories} services={services} staff={staff} />
  );
}
