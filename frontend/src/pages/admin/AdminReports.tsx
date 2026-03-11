import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import type { Report } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const AdminReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionAction, setResolutionAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getReports({
        status: statusFilter || undefined
      });
      setReports(response.reports);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (reportId: string) => {
    try {
      await adminService.assignReport(reportId);
      toast.success('Report assigned to you');
      fetchReports();
    } catch (error) {
      toast.error('Failed to assign report');
    }
  };

  const handleResolve = async () => {
    if (!selectedReport || !resolutionAction) return;
    setIsSubmitting(true);
    try {
      await adminService.resolveReport(selectedReport._id, resolutionAction, resolutionNotes);
      toast.success('Report resolved');
      setShowResolveDialog(false);
      setResolutionNotes('');
      setResolutionAction('');
      fetchReports();
    } catch (error) {
      toast.error('Failed to resolve report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async (reportId: string) => {
    try {
      await adminService.dismissReport(reportId, 'No action needed');
      toast.success('Report dismissed');
      fetchReports();
    } catch (error) {
      toast.error('Failed to dismiss report');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const variants: { [key: string]: string } = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return variants[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Manage user reports and disputes</p>
      </div>

      {/* Filters */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Reports</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="under_review">Under Review</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="dismissed">Dismissed</SelectItem>
        </SelectContent>
      </Select>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell className="capitalize">{report.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={report.reporter.profilePicture} />
                          <AvatarFallback>{report.reporter.firstName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{report.reporter.firstName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={report.reported.profilePicture} />
                          <AvatarFallback>{report.reported.firstName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{report.reported.firstName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{report.reason.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadge(report.priority)}>
                        {report.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(report.status)}>
                        {report.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {report.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssign(report._id)}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        )}
                        {report.status === 'under_review' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedReport(report); setShowResolveDialog(true); }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDismiss(report._id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              Select an action to resolve this report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={resolutionAction} onValueChange={setResolutionAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warning">Issue Warning</SelectItem>
                <SelectItem value="suspension">Suspend User</SelectItem>
                <SelectItem value="ban">Ban User</SelectItem>
                <SelectItem value="content_removed">Remove Content</SelectItem>
                <SelectItem value="none">No Action</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Add resolution notes..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={isSubmitting || !resolutionAction}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resolve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
