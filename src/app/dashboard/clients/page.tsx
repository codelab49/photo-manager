import { Metadata } from "next";
import ClientManagement from "./ClientManagement";

export const metadata: Metadata = {
  title: "Manage Clients",
  description: "Manage client information and gallery recipients"
};

export default function ClientsPage() {
  return <ClientManagement />;
}
