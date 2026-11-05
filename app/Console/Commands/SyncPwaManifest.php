<?php

namespace App\Console\Commands;

use App\Services\PwaManifestService;
use Illuminate\Console\Command;

class SyncPwaManifest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pwa:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync PWA manifest and icons with school settings';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        PwaManifestService::syncManifest();
        $this->info('PWA Manifest & Icons successfully synchronized with school settings.');

        return Command::SUCCESS;
    }
}

