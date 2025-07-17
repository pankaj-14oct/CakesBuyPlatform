import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Store, 
  Search, 
  Plus, 
  Eye, 
  Check, 
  X,
  Phone,
  Mail,
  MapPin,
  Building,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Vendor {
  id: number;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  address?: string;
  description?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: number;
}

export default function AdminVendors() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendorsData, isLoading } = useQuery({
    queryKey: ["/api/admin/vendors", currentPage, searchTerm],
    queryFn: async () => {
      const response = await apiRequest(`/api/admin/vendors?page=${currentPage}&limit=10&search=${searchTerm}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("admin_token")}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch vendors");
      }
      
      return response.json();
    }
  });

  const approveVendorMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      const response = await apiRequest(`/api/admin/vendors/${vendorId}/approve`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("admin_token")}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to approve vendor");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vendor Approved",
        description: "Vendor has been approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deactivateVendorMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      const response = await apiRequest(`/api/admin/vendors/${vendorId}/deactivate`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("admin_token")}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to deactivate vendor");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vendor Deactivated",
        description: "Vendor has been deactivated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Deactivation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowVendorDialog(true);
  };

  const vendors = vendorsData?.vendors || [];
  const totalPages = vendorsData?.pages || 1;
  const totalVendors = vendorsData?.total || 0;

  const getStatusBadge = (vendor: Vendor) => {
    if (!vendor.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (!vendor.isVerified) {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600">Manage vendor registrations and approvals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Store className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">{totalVendors} Total Vendors</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendors</CardTitle>
          <CardDescription>View and manage all vendor accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button type="submit" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading vendors...</div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-8">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No vendors found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor: Vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vendor.businessName}</div>
                          <div className="text-sm text-gray-500">ID: {vendor.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          <div className="text-sm text-gray-500">{vendor.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{vendor.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(vendor)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => handleViewVendor(vendor)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {!vendor.isActive && !vendor.isVerified && (
                            <Button
                              onClick={() => approveVendorMutation.mutate(vendor.id)}
                              size="sm"
                              variant="default"
                              disabled={approveVendorMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {vendor.isActive && (
                            <Button
                              onClick={() => deactivateVendorMutation.mutate(vendor.id)}
                              size="sm"
                              variant="destructive"
                              disabled={deactivateVendorMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalVendors)} of {totalVendors} vendors
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>
              Complete information about the vendor
            </DialogDescription>
          </DialogHeader>
          
          {selectedVendor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Business Name</label>
                  <p className="text-sm text-gray-900">{selectedVendor.businessName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Owner Name</label>
                  <p className="text-sm text-gray-900">{selectedVendor.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedVendor.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedVendor.phone}</span>
                  </div>
                </div>
              </div>
              
              {selectedVendor.address && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-900">{selectedVendor.address}</span>
                  </div>
                </div>
              )}
              
              {selectedVendor.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedVendor.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Registration Date</label>
                  <p className="text-sm text-gray-900">{new Date(selectedVendor.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedVendor)}</div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                {!selectedVendor.isActive && !selectedVendor.isVerified && (
                  <Button
                    onClick={() => {
                      approveVendorMutation.mutate(selectedVendor.id);
                      setShowVendorDialog(false);
                    }}
                    disabled={approveVendorMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Vendor
                  </Button>
                )}
                
                {selectedVendor.isActive && (
                  <Button
                    onClick={() => {
                      deactivateVendorMutation.mutate(selectedVendor.id);
                      setShowVendorDialog(false);
                    }}
                    variant="destructive"
                    disabled={deactivateVendorMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Deactivate Vendor
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}