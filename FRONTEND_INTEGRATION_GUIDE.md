# 🎨 FRONTEND INTEGRATION GUIDE

## Implementasi CreateEmployeeModal di Aplikasi

Panduan lengkap cara mengintegrasikan `CreateEmployeeModal` component ke aplikasi React Anda.

---

## 📍 Opsi 1: Integrasi di Halaman Employee Management Existing

Jika sudah ada halaman employee management, tambahkan component di dalamnya.

### Langkah 1: Import Component

```typescript
// pages/admin/EmployeesPage.tsx

import { useState } from "react";
import CreateEmployeeModal from "@/components/employee/CreateEmployeeModal";
import EmployeeList from "@/components/employee/EmployeeList";

export default function EmployeesPage() {
    const [showModal, setShowModal] = useState(false);
    const [refresh, setRefresh] = useState(0);

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manajemen Karyawan</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                    + Tambah Karyawan
                </button>
            </div>

            {showModal && (
                <CreateEmployeeModal
                    onSuccess={() => {
                        setShowModal(false);
                        setRefresh((prev) => prev + 1);
                    }}
                />
            )}

            <EmployeeList key={refresh} />
        </div>
    );
}
```

### Langkah 2: Modifikasi Component (Opsional)

Jika ingin customize, edit `CreateEmployeeModal.tsx`:

```typescript
// Untuk membuat modal dalam dialog/modal box
export function CreateEmployeeModalWithDialog() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button onClick={() => setIsOpen(true)}>Tambah Karyawan</button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">
                            Tambah Karyawan Baru
                        </h2>
                        <CreateEmployeeModal
                            onSuccess={() => setIsOpen(false)}
                        />
                        <button
                            onClick={() => setIsOpen(false)}
                            className="mt-4 text-red-500 hover:text-red-700"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
```

---

## 📍 Opsi 2: Buat Halaman Baru (Full Page)

### Buat File Baru

```typescript
// pages/admin/employees/create.tsx

import { useNavigate } from "react-router-dom";
import CreateEmployeeModal from "@/components/employee/CreateEmployeeModal";

export default function CreateEmployeePage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 text-blue-500 hover:text-blue-700 flex items-center"
                >
                    ← Kembali
                </button>

                <div className="bg-white rounded-lg shadow p-8">
                    <h1 className="text-3xl font-bold mb-8">
                        Tambah Karyawan Baru
                    </h1>

                    <CreateEmployeeModal
                        onSuccess={() => {
                            navigate("/employees");
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
```

### Update Routes (App.tsx)

```typescript
// App.tsx

import CreateEmployeePage from "@/pages/admin/employees/create";

export function App() {
    return (
        <Routes>
            {/* ... existing routes ... */}
            <Route
                path="/employees/create"
                element={<CreateEmployeePage />}
                // Atau jika punya permission middleware:
                // element={<Protected element={<CreateEmployeePage />} permission="manage_employees" />}
            />
        </Routes>
    );
}
```

---

## 🎯 Opsi 3: Modal Dialog dengan Shadcn/UI

Jika menggunakan shadcn/ui:

```typescript
// components/employee/EmployeeCreateDialog.tsx

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import CreateEmployeeModal from "@/components/employee/CreateEmployeeModal";

export function EmployeeCreateDialog() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="bg-blue-500 text-white px-4 py-2 rounded">
                    Tambah Karyawan
                </button>
            </DialogTrigger>

            <DialogContent className="w-full max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tambah Karyawan Baru</DialogTitle>
                    <DialogDescription>
                        Pilih user yang sudah ada untuk ditambahkan sebagai
                        karyawan
                    </DialogDescription>
                </DialogHeader>

                <CreateEmployeeModal onSuccess={() => setIsOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
```

---

## 🎯 Opsi 4: Modal dengan Antd (Ant Design)

Jika menggunakan Ant Design:

```typescript
// components/employee/EmployeeCreateModal.tsx

import { useState } from "react";
import { Modal, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import CreateEmployeeModal from "@/components/employee/CreateEmployeeModal";

export function EmployeeCreateModalAntd() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showModal}
                size="large"
            >
                Tambah Karyawan
            </Button>

            <Modal
                title="Tambah Karyawan Baru"
                open={isModalOpen}
                onCancel={handleCancel}
                width={700}
                footer={null}
            >
                <CreateEmployeeModal
                    onSuccess={() => {
                        handleCancel();
                    }}
                />
            </Modal>
        </>
    );
}
```

---

## 🔧 Customization

### 1. Ubah Styling

```typescript
// Ubah className di component atau buat wrapper

export function CustomStyledCreateEmployeeModal() {
    return (
        <div className="bg-gradient-to-b from-blue-50 to-white p-8 rounded-lg">
            <CreateEmployeeModal />
        </div>
    );
}
```

### 2. Tambah Toast Notification

```typescript
// Jika belum ada toast provider, tambahkan

import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

export function EmployeeManagement() {
    const { toast } = useToast();

    return (
        <div>
            <CreateEmployeeModal
                onSuccess={() => {
                    toast({
                        title: "Success",
                        description: "Employee berhasil ditambahkan",
                    });
                }}
            />
            <Toaster />
        </div>
    );
}
```

### 3. Tambah Loading Overlay

```typescript
// pages/admin/employees.tsx

import { useState } from "react";
import CreateEmployeeModal from "@/components/employee/CreateEmployeeModal";

export function EmployeesPage() {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div
            className={`transition-opacity ${
                isLoading ? "opacity-50 pointer-events-none" : ""
            }`}
        >
            <CreateEmployeeModal onSuccess={() => setIsLoading(false)} />
            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center">
                    <div className="animate-spin">⏳</div>
                </div>
            )}
        </div>
    );
}
```

---

## 📱 Responsive Design

Component sudah responsive, tapi bisa ditingkatkan:

```typescript
// Wrapper dengan responsive padding
export function ResponsiveEmployeeModal() {
    return (
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
            <div className="max-w-2xl mx-auto">
                <CreateEmployeeModal />
            </div>
        </div>
    );
}
```

---

## 🧪 Testing

### Unit Test Example

```typescript
// __tests__/CreateEmployeeModal.test.tsx

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateEmployeeModal from "@/components/employee/CreateEmployeeModal";

describe("CreateEmployeeModal", () => {
    it("loads available users on mount", async () => {
        render(<CreateEmployeeModal />);

        await waitFor(() => {
            expect(screen.getByText("-- Pilih User --")).toBeInTheDocument();
        });
    });

    it("submits form with correct data", async () => {
        const user = userEvent.setup();
        render(<CreateEmployeeModal />);

        // Select user
        const select = screen.getByLabelText("Pilih User");
        await user.click(select);
        // ... select option ...

        // Fill form
        await user.type(screen.getByLabelText("No. Telepon"), "08123456789");
        // ... fill other fields ...

        // Submit
        await user.click(screen.getByText("Simpan Employee"));

        await waitFor(() => {
            expect(
                screen.getByText(/berhasil ditambahkan/i)
            ).toBeInTheDocument();
        });
    });

    it("displays error message on invalid submission", async () => {
        const user = userEvent.setup();
        render(<CreateEmployeeModal />);

        // Try submit without selecting user
        await user.click(screen.getByText("Simpan Employee"));

        expect(
            screen.getByText(/Pilih user terlebih dahulu/i)
        ).toBeInTheDocument();
    });
});
```

---

## 🔌 Integration dengan API Real

Component sudah configured untuk API real. Pastikan:

1. ✅ API endpoint `/api/employees/available-users/list` accessible
2. ✅ API endpoint `/api/employees` accessible
3. ✅ Authorization token tersedia (auto-attached by axios)
4. ✅ CORS configured properly (jika API beda domain)

---

## 📦 Props (Opsional)

Jika ingin tambah props ke component:

```typescript
interface CreateEmployeeModalProps {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    defaultDepartment?: string;
    disabled?: boolean;
}

export function CreateEmployeeModal({
    onSuccess,
    onError,
    defaultDepartment = "",
    disabled = false,
}: CreateEmployeeModalProps) {
    // ... implementation ...
}
```

---

## 🎯 Checklist Integrasi

-   [ ] Import `CreateEmployeeModal` di halaman
-   [ ] Tambahkan button/trigger untuk open modal
-   [ ] Handle `onSuccess` callback untuk refresh data
-   [ ] Test di browser (dropdown users, form validation, submit)
-   [ ] Test error cases (invalid user, duplicate)
-   [ ] Style sesuai dengan design sistem
-   [ ] Add to responsive breakpoints
-   [ ] Add loading/error states
-   [ ] Add success notifications
-   [ ] Document untuk team

---

## 🐛 Troubleshooting

### Problem: "Module not found: @/components/employee/CreateEmployeeModal"

**Solution:** Pastikan file ada di path yang benar dan import path sesuai alias

### Problem: "axios is not defined"

**Solution:** Component menggunakan axios, pastikan sudah terinstall

```bash
npm install axios
```

### Problem: "useToast is not defined"

**Solution:** Toast hook opsional. Jika tidak ada, hapus atau ganti dengan console.log

### Problem: TypeScript error untuk types

**Solution:** Pastikan TypeScript version compatible dan run `npm install`

---

## 📚 Dokumentasi Lengkap

Untuk info lebih lanjut, baca:

-   [EMPLOYEE_FROM_USER.md](./EMPLOYEE_FROM_USER.md) - Dokumentasi API
-   [QUICKSTART_EMPLOYEE.md](./QUICKSTART_EMPLOYEE.md) - Quick start
-   [EMPLOYEE_MIGRATION_SUMMARY.md](./EMPLOYEE_MIGRATION_SUMMARY.md) - Technical details

---

## ✨ Done!

Component sudah siap diintegrasikan. Pilih salah satu opsi di atas sesuai dengan structure aplikasi Anda. Happy coding! 🚀
