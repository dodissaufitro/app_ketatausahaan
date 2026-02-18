import { useEffect, useState } from 'react';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
}

interface FormData {
    user_id: string | number;
    phone: string;
    department: string;
    position: string;
    join_date: string;
    status: 'active' | 'inactive' | 'on-leave';
    salary: number | string;
    avatar?: string;
}

export function CreateEmployeeModal() {
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState<FormData>({
        user_id: '',
        phone: '',
        department: '',
        position: '',
        join_date: '',
        status: 'active',
        salary: 0,
    });

    // Load available users saat component mount
    useEffect(() => {
        fetchAvailableUsers();
    }, []);

    const fetchAvailableUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/employees/available-users/list');
            setAvailableUsers(response.data);
            setError('');
        } catch (err: any) {
            setError('Gagal memuat daftar user');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'salary' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validasi
        if (!formData.user_id) {
            setError('Pilih user terlebih dahulu');
            return;
        }
        if (!formData.phone || !formData.department || !formData.position || !formData.join_date) {
            setError('Semua field harus diisi');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const response = await axios.post('/api/employees', {
                user_id: parseInt(formData.user_id.toString()),
                phone: formData.phone,
                department: formData.department,
                position: formData.position,
                join_date: formData.join_date,
                status: formData.status,
                salary: formData.salary,
                avatar: formData.avatar || null,
            });

            setSuccess(`Employee ${response.data.name} (${response.data.employee_id}) berhasil ditambahkan!`);
            
            // Reset form
            setFormData({
                user_id: '',
                phone: '',
                department: '',
                position: '',
                join_date: '',
                status: 'active',
                salary: 0,
            });

            // Reload available users
            await fetchAvailableUsers();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);

        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data?.errors?.user_id?.[0] || 'Gagal membuat employee';
            setError(errorMsg);
            console.error('Error creating employee:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Tambah Employee Baru</h2>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Select User */}
                    <div className="form-group">
                        <label htmlFor="user_id">Pilih User</label>
                        <select
                            id="user_id"
                            name="user_id"
                            value={formData.user_id}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        >
                            <option value="">-- Pilih User --</option>
                            {availableUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </select>
                        {availableUsers.length === 0 && !loading && (
                            <small className="text-muted">Tidak ada user yang tersedia</small>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label htmlFor="phone">No. Telepon</label>
                        <input
                            type="text"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="08123456789"
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Department */}
                    <div className="form-group">
                        <label htmlFor="department">Department</label>
                        <input
                            type="text"
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            placeholder="IT, HR, Finance, etc"
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Position */}
                    <div className="form-group">
                        <label htmlFor="position">Posisi</label>
                        <input
                            type="text"
                            id="position"
                            name="position"
                            value={formData.position}
                            onChange={handleInputChange}
                            placeholder="Developer, Manager, etc"
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Join Date */}
                    <div className="form-group">
                        <label htmlFor="join_date">Tanggal Bergabung</label>
                        <input
                            type="date"
                            id="join_date"
                            name="join_date"
                            value={formData.join_date}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Status */}
                    <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            disabled={loading}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="on-leave">On Leave</option>
                        </select>
                    </div>

                    {/* Salary */}
                    <div className="form-group">
                        <label htmlFor="salary">Gaji (Rp)</label>
                        <input
                            type="number"
                            id="salary"
                            name="salary"
                            value={formData.salary}
                            onChange={handleInputChange}
                            placeholder="5000000"
                            min="0"
                            step="100000"
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Avatar URL (Optional) */}
                    <div className="form-group">
                        <label htmlFor="avatar">URL Avatar (Opsional)</label>
                        <input
                            type="text"
                            id="avatar"
                            name="avatar"
                            value={formData.avatar || ''}
                            onChange={handleInputChange}
                            placeholder="https://example.com/avatar.jpg"
                            disabled={loading}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Employee'}
                        </button>
                        <button
                            type="reset"
                            disabled={loading}
                            className="btn btn-secondary"
                            onClick={() => {
                                setFormData({
                                    user_id: '',
                                    phone: '',
                                    department: '',
                                    position: '',
                                    join_date: '',
                                    status: 'active',
                                    salary: 0,
                                });
                                setError('');
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateEmployeeModal;
