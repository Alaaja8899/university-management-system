"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Download, PrinterIcon as Print, DollarSign, CalendarIcon, Filter } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx" // Import Excel library

interface Fee {
  _id: string
  studentId: {
    _id: string
    name: string
  }
  financeType: string
  amount: number
  amountPaid: number
  balance: number
  status: "paid" | "partial" | "unpaid"
  description: string
  date: string
  createdAt: string
  updatedAt: string
}

interface Student {
  _id: string
  classId: {
    _id: string
    departmentId: {
      _id: string
      name: string
    }
    semester: number
    classMode: string
    type: string
  }
  name: string
  gender: string
  parentPhone: string
  phone: string
  studentId: number
  status: string
  createdAt: string
  updatedAt: string
}

interface Class {
  _id: string
  departmentId: {
    _id: string
    name: string
  }
  semester: number
  classMode: string
  type: string
  status: string
  createdAt: string
  updatedAt: string
}

interface FeeReportData {
  fees: Fee[]
  summary: {
    totalAmount: number
    totalPaid: number
    totalPending: number
    paidCount: number
    partialCount: number
    unpaidCount: number
  }
}

export function FeeReport() {
  const [filterType, setFilterType] = useState("dateRange")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [reportData, setReportData] = useState<FeeReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [fees, setFees] = useState<Fee[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feesRes, studentsRes, classesRes] = await Promise.all([
          fetch("/api/fees"),
          fetch("/api/student"),
          fetch("/api/classes")
        ])
        
        const [feesData, studentsData, classesData] = await Promise.all([
          feesRes.json(),
          studentsRes.json(),
          classesRes.json()
        ])
        
        setFees(feesData)
        setStudents(studentsData)
        setClasses(classesData)
      } catch (error) {
        console.error("Failed to fetch data", error)
      } finally {
        setInitialLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const generateReport = () => {
    setLoading(true)

    setTimeout(() => {
      let filteredFees = [...fees]

      if (filterType === "dateRange" && startDate && endDate) {
        filteredFees = filteredFees.filter((fee) => {
          const feeDate = new Date(fee.date)
          return feeDate >= startDate && feeDate <= endDate
        })
      } else if (filterType === "student" && selectedStudent) {
        filteredFees = filteredFees.filter((fee) => fee.studentId.id === selectedStudent)
      } else if (filterType === "class" && selectedClass) {
        const classStudents = students.filter((s) => s.classId._id === selectedClass)
        const studentIds = classStudents.map((s) => s._id)
        filteredFees = filteredFees.filter((fee) => studentIds.includes(fee.studentId._id))
      }

      // Calculate summary
      const totalAmount = filteredFees.reduce((sum, fee) => sum + fee.amount, 0)
      const totalPaid = filteredFees.reduce((sum, fee) => sum + fee.amountPaid, 0)
      const totalPending = totalAmount - totalPaid
      const paidCount = filteredFees.filter((fee) => fee.status === "paid").length
      const partialCount = filteredFees.filter((fee) => fee.status === "partial").length
      const unpaidCount = filteredFees.filter((fee) => fee.status === "unpaid").length

      setReportData({
        fees: filteredFees,
        summary: {
          totalAmount,
          totalPaid,
          totalPending,
          paidCount,
          partialCount,
          unpaidCount,
        },
      })
      setLoading(false)
    }, 1000)
  }

  const handlePrint = () => {
    const printContent = document.getElementById("report-content")?.innerHTML;
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    } else {
      window.print();
    }
  }

  const handleDownload = () => {
    if (!reportData) {
      alert("No report data to download");
      return;
    }

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Create detailed worksheet
      const detailedData = [
        ["Student", "Class", "Finance Type", "Amount", "Paid", "Balance", "Status", "Date"],
        ...reportData.fees.map(fee => [
          fee.studentId?.name || "Unknown",
          "unknown",
          fee.financeType,
          fee.amount,
          fee.amountPaid,
          fee.balance,
          fee.status,
          new Date(fee.date).toLocaleDateString()
        ])
      ];
      
      const wsDetailed = XLSX.utils.aoa_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(wb, wsDetailed, "Fee Records");
      
      // Create summary worksheet
      const summaryData = [
        ["Summary", ""],
        ["Total Amount", reportData.summary.totalAmount],
        ["Total Paid", reportData.summary.totalPaid],
        ["Total Pending", reportData.summary.totalPending],
        ["", ""],
        ["Payment Status", "Count"],
        ["Paid", reportData.summary.paidCount],
        ["Partial", reportData.summary.partialCount],
        ["Unpaid", reportData.summary.unpaidCount]
      ];
      
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
      
      // Generate file and download
      const fileName = `fee-report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Failed to generate Excel file:", error);
      alert("Failed to generate Excel file. Please try again.");
    }
  }

  const formatClassName = (cls: Class) => {
    return `${cls.departmentId.name} - Semester ${cls.semester} ${cls.classMode} ${cls.type}`
  }

  const getClassName = (studentId: string) => {
    const student = students.find((s) => s._id === studentId)
    if (!student) return "Unknown"
    
    const cls = classes.find((c) => c._id === student.classId._id)
    return cls ? formatClassName(cls) : "Unknown"
  }

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Generate Fee Report
          </CardTitle>
          <CardDescription>Filter fee records by date range, student, or class</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Filter Type</Label>
            <RadioGroup value={filterType} onValueChange={setFilterType} className="flex gap-6 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dateRange" id="dateRange" />
                <Label htmlFor="dateRange">Date Range</Label>
              </div>
              {/* <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="class" id="class" />
                <Label htmlFor="class">Class</Label>
              </div> */}
            </RadioGroup>
          </div>

          {filterType === "dateRange" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {filterType === "student" && (
            <div>
              <Label>Select Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.name} ({student.studentId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterType === "class" && (
            <div>
              <Label>Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {formatClassName(cls)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={generateReport} disabled={loading} className="w-full">
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <div id="report-content" className="space-y-6 print:space-y-4">
          {/* Report Header */}
          <div className="flex justify-between items-start print:hidden">
            <div>
              <h2 className="text-xl font-semibold">Fee Report</h2>
              <p className="text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Print className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download Excel
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">${reportData.summary.totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">${reportData.summary.totalPaid.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Paid</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">${reportData.summary.totalPending.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Pending</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{reportData.summary.paidCount}</div>
                  <div className="text-sm text-muted-foreground">Paid</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{reportData.summary.partialCount}</div>
                  <div className="text-sm text-muted-foreground">Partial</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{reportData.summary.unpaidCount}</div>
                  <div className="text-sm text-muted-foreground">Unpaid</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Records</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.fees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Finance Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.fees.map((fee) => (
                      <TableRow key={fee._id}>
                        <TableCell>{fee.studentId && fee.studentId.name ? fee.studentId.name : "Unknown"}</TableCell>
                        <TableCell>Unknow class</TableCell>
                        <TableCell className="capitalize">{fee.financeType}</TableCell>
                        <TableCell>${fee.amount.toFixed(2)}</TableCell>
                        <TableCell>${fee.amountPaid.toFixed(2)}</TableCell>
                        <TableCell>${fee.balance.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              fee.status === "paid" ? "default" : fee.status === "partial" ? "secondary" : "destructive"
                            }
                          >
                            {fee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(fee.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No fee records found for the selected criteria.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}