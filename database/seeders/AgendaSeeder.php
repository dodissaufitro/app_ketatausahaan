<?php

namespace Database\Seeders;

use App\Models\Agenda;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class AgendaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $agendas = [
            [
                'title' => 'Rapat Koordinasi Tim',
                'description' => 'Pembahasan progress project Q4 2025',
                'start_date' => Carbon::now()->addDays(1)->setTime(9, 0),
                'end_date' => Carbon::now()->addDays(1)->setTime(11, 0),
                'location' => 'Ruang Meeting A',
                'category' => 'meeting',
                'status' => 'scheduled',
                'created_by' => 'Admin',
            ],
            [
                'title' => 'Presentasi Proposal Client',
                'description' => 'Presentasi proposal untuk client baru ABC Corp',
                'start_date' => Carbon::now()->addDays(3)->setTime(14, 0),
                'end_date' => Carbon::now()->addDays(3)->setTime(16, 0),
                'location' => 'Virtual - Zoom',
                'category' => 'meeting',
                'status' => 'scheduled',
                'created_by' => 'Admin',
            ],
            [
                'title' => 'Training Karyawan Baru',
                'description' => 'Onboarding dan training untuk 5 karyawan baru',
                'start_date' => Carbon::now()->addDays(5)->setTime(8, 0),
                'end_date' => Carbon::now()->addDays(5)->setTime(17, 0),
                'location' => 'Ruang Training Lt.3',
                'category' => 'event',
                'status' => 'scheduled',
                'created_by' => 'HR Department',
            ],
            [
                'title' => 'Deadline Submit Report',
                'description' => 'Pengumpulan laporan bulanan semua departemen',
                'start_date' => Carbon::now()->addDays(7)->setTime(17, 0),
                'end_date' => Carbon::now()->addDays(7)->setTime(17, 0),
                'location' => null,
                'category' => 'reminder',
                'status' => 'scheduled',
                'created_by' => 'Manager',
            ],
            [
                'title' => 'Workshop UI/UX Design',
                'description' => 'Workshop desain untuk tim product development',
                'start_date' => Carbon::now()->addDays(10)->setTime(13, 0),
                'end_date' => Carbon::now()->addDays(10)->setTime(17, 0),
                'location' => 'Creative Space Lt.2',
                'category' => 'event',
                'status' => 'scheduled',
                'created_by' => 'Design Lead',
            ],
            [
                'title' => 'Code Review Session',
                'description' => 'Review dan diskusi kode untuk fitur baru',
                'start_date' => Carbon::now()->addDays(2)->setTime(10, 0),
                'end_date' => Carbon::now()->addDays(2)->setTime(12, 0),
                'location' => 'Development Room',
                'category' => 'meeting',
                'status' => 'scheduled',
                'created_by' => 'Tech Lead',
            ],
            [
                'title' => 'Perayaan HUT Perusahaan',
                'description' => 'Acara perayaan ulang tahun ke-10 perusahaan',
                'start_date' => Carbon::now()->addDays(15)->setTime(18, 0),
                'end_date' => Carbon::now()->addDays(15)->setTime(22, 0),
                'location' => 'Grand Ballroom Hotel XYZ',
                'category' => 'event',
                'status' => 'scheduled',
                'created_by' => 'Event Committee',
            ],
            [
                'title' => 'Sprint Planning',
                'description' => 'Perencanaan sprint untuk 2 minggu kedepan',
                'start_date' => Carbon::now()->addDays(4)->setTime(9, 0),
                'end_date' => Carbon::now()->addDays(4)->setTime(11, 0),
                'location' => 'Ruang Scrum',
                'category' => 'meeting',
                'status' => 'scheduled',
                'created_by' => 'Scrum Master',
            ],
            [
                'title' => 'Update Dokumentasi API',
                'description' => 'Task untuk update dokumentasi API versi terbaru',
                'start_date' => Carbon::now()->addDays(6)->setTime(9, 0),
                'end_date' => Carbon::now()->addDays(6)->setTime(17, 0),
                'location' => null,
                'category' => 'task',
                'status' => 'scheduled',
                'created_by' => 'Backend Team',
            ],
            [
                'title' => 'Client Meeting - Project Review',
                'description' => 'Review progress project dengan client',
                'start_date' => Carbon::now()->addDays(8)->setTime(15, 0),
                'end_date' => Carbon::now()->addDays(8)->setTime(16, 30),
                'location' => 'Client Office',
                'category' => 'meeting',
                'status' => 'scheduled',
                'created_by' => 'Project Manager',
            ],
        ];

        foreach ($agendas as $agenda) {
            Agenda::create($agenda);
        }
    }
}
