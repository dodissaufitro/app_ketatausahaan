<?php

namespace Database\Seeders;

use App\Models\OutgoingMail;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OutgoingMailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $mails = [
            [
                'mail_number' => 'OUT/001/I/2026',
                'recipient' => 'Dinas Pendidikan Kota',
                'subject' => 'Undangan Rapat Koordinasi',
                'sent_date' => '2026-01-20',
                'category' => 'invitation',
                'priority' => 'high',
                'status' => 'sent',
                'description' => 'Undangan rapat koordinasi terkait program kegiatan tahun 2026',
            ],
            [
                'mail_number' => 'OUT/002/I/2026',
                'recipient' => 'PT. ABC Indonesia',
                'subject' => 'Penawaran Kerjasama',
                'sent_date' => '2026-01-22',
                'category' => 'official',
                'priority' => 'medium',
                'status' => 'sent',
                'description' => 'Surat penawaran kerjasama untuk program CSR',
            ],
            [
                'mail_number' => 'OUT/003/I/2026',
                'recipient' => 'Kelurahan Setempat',
                'subject' => 'Pemberitahuan Kegiatan',
                'sent_date' => '2026-01-25',
                'category' => 'notification',
                'priority' => 'medium',
                'status' => 'delivered',
                'description' => 'Pemberitahuan akan diadakan kegiatan sosial',
            ],
        ];

        foreach ($mails as $mail) {
            OutgoingMail::create($mail);
        }

        $this->command->info('Outgoing mails seeded successfully!');
    }
}
