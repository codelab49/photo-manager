"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ClientRecipient {
  id?: string;
  name: string;
  email: string;
  relation: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  recipients: ClientRecipient[];
  _count?: {
    sessions: number;
    galleries: number;
  };
}

export default function ClientManagement() {
  const { status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [recipients, setRecipients] = useState<ClientRecipient[]>([]);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Load clients
  useEffect(() => {
    if (status === "authenticated") {
      loadClients();
    }
  }, [status]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      } else {
        console.error("Failed to load clients");
      }
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRecipients([]);
    setEditingClient(null);
    setShowForm(false);
  };

  const startEditing = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone || "");
    setRecipients(client.recipients || []);
    setShowForm(true);
  };

  const addRecipient = () => {
    setRecipients([...recipients, { name: "", email: "", relation: "" }]);
  };

  const updateRecipient = (
    index: number,
    field: keyof ClientRecipient,
    value: string
  ) => {
    const updated = recipients.map((recipient, i) =>
      i === index ? { ...recipient, [field]: value } : recipient
    );
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!name.trim()) return "Client name is required";
    if (!email.trim()) return "Client email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Invalid email format";

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      if (!recipient.name.trim()) return `Recipient ${i + 1} name is required`;
      if (!recipient.email.trim())
        return `Recipient ${i + 1} email is required`;
      if (!/\S+@\S+\.\S+/.test(recipient.email))
        return `Recipient ${i + 1} has invalid email format`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    try {
      const url = editingClient
        ? `/api/clients/${editingClient.id}`
        : "/api/clients";
      const method = editingClient ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          recipients: recipients.filter((r) => r.name.trim() && r.email.trim())
        })
      });

      if (response.ok) {
        await loadClients();
        resetForm();
        alert(
          editingClient
            ? "Client updated successfully!"
            : "Client created successfully!"
        );
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to save client"}`);
      }
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Error saving client");
    }
  };

  const deleteClient = async (clientId: string, clientName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete client "${clientName}"? This will also delete all associated sessions and galleries.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        await loadClients();
        alert("Client deleted successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to delete client"}`);
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Error deleting client");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Manage Clients
                </h1>
                <p className="text-gray-600">
                  Manage client information and default gallery recipients
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Add New Client
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Client Form */}
            {showForm && (
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingClient ? "Edit Client" : "Add New Client"}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Client Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                        placeholder="e.g., John & Jane Smith"
                        required
                      />
                    </div>

                    {/* Client Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Primary Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                        placeholder="client@example.com"
                        required
                      />
                    </div>

                    {/* Client Phone */}
                    <div className="md:col-span-2">
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  {/* Gallery Recipients */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Default Gallery Recipients
                        </label>
                        <p className="text-xs text-gray-500">
                          These people will automatically be added to gallery
                          access lists
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addRecipient}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                      >
                        Add Recipient
                      </button>
                    </div>

                    {recipients.length === 0 ? (
                      <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
                        <p className="text-gray-500 text-sm">
                          No recipients configured
                        </p>
                        <p className="text-gray-400 text-xs">
                          Galleries will only include the client&apos;s primary
                          email
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {recipients.map((recipient, index) => (
                          <div
                            key={index}
                            className="flex gap-3 items-center bg-white p-3 rounded-md border"
                          >
                            <div className="flex-1">
                              <input
                                type="text"
                                value={recipient.name}
                                onChange={(e) =>
                                  updateRecipient(index, "name", e.target.value)
                                }
                                placeholder="Full Name"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="email"
                                value={recipient.email}
                                onChange={(e) =>
                                  updateRecipient(
                                    index,
                                    "email",
                                    e.target.value
                                  )
                                }
                                placeholder="email@example.com"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={recipient.relation}
                                onChange={(e) =>
                                  updateRecipient(
                                    index,
                                    "relation",
                                    e.target.value
                                  )
                                }
                                placeholder="Relation (e.g., Bride, Groom)"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRecipient(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Remove recipient"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      {editingClient ? "Update Client" : "Create Client"}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Clients List */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Existing Clients ({clients.length})
              </h2>

              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No clients found</p>
                  <p className="text-gray-400 text-sm">
                    Add your first client to get started
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {client.name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {client.email}
                          </p>
                          {client.phone && (
                            <p className="text-gray-600 text-sm">
                              {client.phone}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Created:{" "}
                            {new Date(client.createdAt).toLocaleDateString()}
                          </p>

                          {/* Recipients */}
                          {client.recipients &&
                            client.recipients.length > 0 && (
                              <div className="mt-3 p-2 bg-gray-50 rounded">
                                <p className="text-xs font-medium text-gray-700 mb-1">
                                  Gallery Recipients ({client.recipients.length}
                                  )
                                </p>
                                <div className="space-y-1">
                                  {client.recipients.map((recipient, index) => (
                                    <div
                                      key={index}
                                      className="text-xs text-gray-600"
                                    >
                                      {recipient.name} ({recipient.email})
                                      {recipient.relation && (
                                        <span className="text-gray-500">
                                          {" "}
                                          - {recipient.relation}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Stats */}
                          {client._count && (
                            <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                              <span>{client._count.sessions} sessions</span>
                              <span>{client._count.galleries} galleries</span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => startEditing(client)}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteClient(client.id, client.name)}
                            className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
