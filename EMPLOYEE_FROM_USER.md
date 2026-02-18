# Employee Management dari User Table

## Penjelasan Perubahan

Sistem penambahan karyawan telah diubah agar mengambil dari tabel `users` yang sudah ada. Fitur ini memastikan bahwa setiap karyawan harus memiliki akun user terlebih dahulu sebelum dapat ditambahkan ke sistem.

## Perubahan yang Dilakukan

### 1. Database Migration

-   **File**: `database/migrations/2025_12_16_000000_add_user_id_to_employees_table.php`
-   **Perubahan**: Menambahkan kolom `user_id` dengan foreign key ke tabel `users`
-   **Status**: ✅ Migration sudah dijalankan

### 2. Employee Model (`app/Models/Employee.php`)

```php
// Tambahan relasi
public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}

// Tambahan fillable
protected $fillable = [
    'user_id',  // ← BARU
    'employee_id',
    'name',
    'email',
    // ... field lainnya
];
```

### 3. EmployeeController (`app/Http/Controllers/EmployeeController.php`)

#### Endpoint Baru:

**GET `/api/employees/available-users/list`**

-   Menampilkan daftar user yang belum menjadi employee
-   Hanya menampilkan user dengan status `is_active = true`
-   Respons berisi: `id`, `name`, `email`
-   Terurut berdasarkan nama (A-Z)

```json
[
    {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
    },
    {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com"
    }
]
```

#### Perubahan Method Store:

**POST `/api/employees`**

**Request body yang baru:**

```json
{
    "user_id": 1,
    "phone": "08123456789",
    "department": "IT",
    "position": "Developer",
    "join_date": "2025-01-01",
    "salary": 5000000,
    "status": "active",
    "avatar": null
}
```

**Validasi:**

-   `user_id` - required, harus ada di tabel users, belum menjadi employee
-   `phone`, `department`, `position`, `join_date`, `salary` - sama seperti sebelumnya
-   `name` dan `email` otomatis diambil dari data user (tidak perlu input manual)
-   `employee_id` otomatis generate (EMP001, EMP002, dst)

**Respons:**

```json
{
    "id": 1,
    "user_id": 1,
    "employee_id": "EMP001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "department": "IT",
    "position": "Developer",
    "join_date": "2025-01-01",
    "status": "active",
    "salary": 5000000,
    "avatar": null,
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
        // ... data user lainnya
    }
}
```

#### Perubahan Method Update:

**PUT `/api/employees/{id}`**

**Request body:**

```json
{
    "phone": "08987654321",
    "department": "HR",
    "position": "Manager",
    "join_date": "2025-01-15",
    "salary": 7000000,
    "status": "active",
    "avatar": "url-avatar"
}
```

**Catatan:**

-   Field `user_id`, `name`, dan `email` tidak bisa diubah (sudah terikat dengan user)
-   Field lainnya bisa diupdate seperti sebelumnya

## Flow Penambahan Employee

1. **Admin membuka halaman Employee Management**
2. **Admin klik tombol "Tambah Employee"**
3. **System menampilkan dropdown/list user yang tersedia**
    - GET `/api/employees/available-users/list`
    - Menampilkan user yang belum menjadi employee
4. **Admin memilih user dari dropdown**
5. **Admin mengisi field: phone, department, position, join_date, salary**
6. **Admin klik tombol "Simpan"**
    - POST `/api/employees` dengan `user_id` yang dipilih
7. **System membuat record employee baru dengan:**
    - Name dan email otomatis dari data user
    - Employee ID otomatis generate
8. **Employee berhasil ditambahkan**

## Contoh Implementasi Frontend (React)

```typescript
import { useEffect, useState } from "react";
import axios from "axios";

export function EmployeeForm() {
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [formData, setFormData] = useState({
        phone: "",
        department: "",
        position: "",
        join_date: "",
        salary: 0,
    });

    // Load available users saat component mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(
                    "/api/employees/available-users/list"
                );
                setAvailableUsers(response.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post("/api/employees", {
                user_id: selectedUserId,
                ...formData,
            });

            console.log("Employee berhasil ditambahkan:", response.data);
            // Refresh list atau redirect ke detail employee
        } catch (error) {
            console.error("Error creating employee:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Select User */}
            <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
            >
                <option value="">-- Pilih User --</option>
                {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                    </option>
                ))}
            </select>

            {/* Phone */}
            <input
                type="text"
                placeholder="No. Telepon"
                value={formData.phone}
                onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                }
                required
            />

            {/* Department */}
            <input
                type="text"
                placeholder="Department"
                value={formData.department}
                onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                }
                required
            />

            {/* Position */}
            <input
                type="text"
                placeholder="Posisi"
                value={formData.position}
                onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                }
                required
            />

            {/* Join Date */}
            <input
                type="date"
                value={formData.join_date}
                onChange={(e) =>
                    setFormData({ ...formData, join_date: e.target.value })
                }
                required
            />

            {/* Salary */}
            <input
                type="number"
                placeholder="Gaji"
                value={formData.salary}
                onChange={(e) =>
                    setFormData({
                        ...formData,
                        salary: parseFloat(e.target.value),
                    })
                }
                required
            />

            <button type="submit">Simpan Employee</button>
        </form>
    );
}
```

## API Endpoints Summary

| Method  | Endpoint                                  | Deskripsi                                         |
| ------- | ----------------------------------------- | ------------------------------------------------- |
| GET     | `/api/employees`                          | Daftar semua employee                             |
| GET     | `/api/employees/next-id/get`              | Dapatkan next employee ID                         |
| **GET** | **`/api/employees/available-users/list`** | **BARU: Daftar user yang belum menjadi employee** |
| POST    | `/api/employees`                          | Tambah employee dari user                         |
| GET     | `/api/employees/{id}`                     | Detail employee                                   |
| PUT     | `/api/employees/{id}`                     | Update employee                                   |
| DELETE  | `/api/employees/{id}`                     | Hapus employee                                    |

## Database Structure

### Tabel `employees` (setelah migration)

```sql
CREATE TABLE employees (
    id BIGINT PRIMARY KEY,
    user_id BIGINT FOREIGN KEY REFERENCES users(id) ON DELETE SET NULL,
    employee_id VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255),
    department VARCHAR(255),
    position VARCHAR(255),
    join_date DATE,
    status ENUM('active', 'inactive', 'on-leave') DEFAULT 'active',
    avatar VARCHAR(255) NULLABLE,
    salary DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Validasi & Error Handling

### Jika user_id tidak valid:

```json
{
    "message": "The selected user_id is invalid.",
    "errors": {
        "user_id": ["The selected user_id is invalid."]
    }
}
```

### Jika user sudah menjadi employee:

```json
{
    "message": "The user_id has already been taken.",
    "errors": {
        "user_id": ["The user_id has already been taken."]
    }
}
```

### Jika user tidak aktif:

User akan tetap bisa dipilih jika melalui database, namun saat fetch available users, hanya user dengan `is_active = true` yang ditampilkan.

## Migrasi Data (Jika ada employee lama)

Jika sebelumnya sudah ada data employee di database, data lama tidak akan terhapus. Anda bisa:

### Opsi 1: Update manual ke user_id terbaru

```php
// Di dalam seeding atau manual query
UPDATE employees SET user_id = NULL WHERE user_id IS NULL;
```

### Opsi 2: Hapus data employee lama dan mulai fresh

```php
// Hati-hati! Ini akan menghapus semua data lama
TRUNCATE TABLE employees;
```

## Testing

```bash
# 1. Jalankan application
npm run dev

# 2. Test endpoint available users
curl http://localhost:8000/api/employees/available-users/list

# 3. Test create employee dari user
curl -X POST http://localhost:8000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "phone": "08123456789",
    "department": "IT",
    "position": "Developer",
    "join_date": "2025-01-01",
    "salary": 5000000
  }'
```

## Keuntungan Sistem Baru

✅ **Konsistensi Data**: Employee harus memiliki user yang valid
✅ **Mengurangi Duplikasi**: Satu user hanya bisa menjadi satu employee
✅ **Sinkronisasi Otomatis**: Nama dan email employee selalu sama dengan usernya
✅ **Audit Trail**: Mudah melacak siapa yang menjadi employee
✅ **Security**: Employee hanya bisa ditambahkan dari user yang sudah terdaftar

## Backward Compatibility

Fitur ini kompatibel dengan fitur yang sudah ada:

-   ✅ X601 Attendance Sync masih bekerja
-   ✅ Attendance Check-in/Check-out masih bekerja
-   ✅ Semua relasi employee tetap berfungsi
