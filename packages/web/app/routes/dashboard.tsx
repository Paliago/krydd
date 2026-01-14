import { BookOpenIcon, CalendarIcon, ScrollIcon } from "lucide-react";
import { useLoaderData } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export async function loader() {
  return { data: { test: 123 } };
}

export default function Dashboard() {
  const { data } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Insert some text here.</p>
      </div>

      <div className="grid gap-6"></div>
    </div>
  );
}
