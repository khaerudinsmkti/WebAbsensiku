<?php

return [
    'vapid' => [
        'subject' => env('VAPID_SUBJECT', 'mailto:admin@absensiku.sch.id'),
        'public_key' => env('VAPID_PUBLIC_KEY', 'BJVjC_Tk_oL7s5cPSJREO5CcE_h4_zsN7mcE8uuwIxMxZT8ch4CnVAt6S9IaT0bqtu0EWPMqitC6mN-E8SjGMJA'),
        'private_key' => env('VAPID_PRIVATE_KEY', 'Jj0GA82l8UTKaQB-pF9sUaZ220HwZfLrNHZ5W0mr2aA'),
        'pem_file' => env('VAPID_PEM_FILE', null),
    ],
    'options' => [
        'timeout' => 15,
        'urgency' => 'high',
        'topic' => 'attendance-reminder',
    ],
];
