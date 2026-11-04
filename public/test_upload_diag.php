<?php
header('Content-Type: application/json');

$tmpDir = ini_get('upload_tmp_dir');
$sysTmp = sys_get_temp_dir();
$uploadMax = ini_get('upload_max_filesize');
$postMax = ini_get('post_max_size');

$tmpWritable = is_writable($sysTmp);
$customTmpWritable = !empty($tmpDir) ? is_writable($tmpDir) : null;

echo json_encode([
    'upload_tmp_dir_ini' => $tmpDir,
    'sys_get_temp_dir' => $sysTmp,
    'sys_tmp_writable' => $tmpWritable,
    'custom_tmp_writable' => $customTmpWritable,
    'upload_max_filesize' => $uploadMax,
    'post_max_size' => $postMax,
    'file_uploads_enabled' => ini_get('file_uploads'),
    'tempnam_test' => @tempnam($sysTmp, 'php_test_'),
]);

