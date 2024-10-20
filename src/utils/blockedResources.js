// src/utils/blockedResources.js

// List of hostnames to skip (any URL that are part of these websites shouldn't be fetched)
// e.g. https://www.reddit.com should be skipped
export const SKIPPED_HOSTS = [
  "reddit.com",
  "redd.it",
  "imgur.com",
  "facebook.com",
  "twitter.com",
  "x.com",
];

// List of extensions to skip and not download (basically any URL that ends with these extensions shouldn't be fetched)
// e.g. https://example.com/movie.mp4 should be skipped
export const SKIPPED_EXTENSIONS = new Set([
  // Document formats
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".odt",
  ".ods",
  ".odp",
  ".rtf",

  // Image formats
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".tif",
  ".svg",
  ".webp",
  ".ico",
  ".heic",
  ".heif",

  // Archive/compressed formats
  ".zip",
  ".rar",
  ".tar",
  ".gz",
  ".7z",
  ".bz2",
  ".xz",
  ".tgz",
  ".tar.gz",
  ".tar.bz2",
  ".tar.xz",

  // Audio formats
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".ogg",
  ".m4a",
  ".wma",
  ".aiff",
  ".aif",
  ".alac",
  ".mid",
  ".midi",

  // Video formats
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
  ".mkv",
  ".webm",
  ".flv",
  ".mpeg",
  ".mpg",
  ".m4v",
  ".3gp",
  ".3g2",

  // Disk image formats
  ".iso",
  ".img",
  ".dmg",
  ".vmdk",
  ".vdi",
  ".vhd",
  ".vhdx",
  ".bin",
  ".cue",
  ".nrg",

  // Executable/binary formats
  ".exe",
  ".bat",
  ".sh",
  ".msi",
  ".cmd",
  ".com",
  ".scr",
  ".apk",
  ".jar",

  // Font formats
  ".ttf",
  ".otf",
  ".woff",
  ".woff2",
  ".eot",
  ".fon",

  // E-book formats
  ".epub",
  ".mobi",
  ".azw",
  ".azw3",
  ".fb2",
  ".lit",

  // CAD formats
  ".dwg",
  ".dxf",
  ".step",
  ".stp",
  ".iges",
  ".igs",

  // 3D Model formats
  ".obj",
  ".fbx",
  ".stl",
  ".dae",
  ".3ds",
  ".gltf",
  ".glb",

  // Database formats
  ".db",
  ".sql",
  ".sqlite",
  ".accdb",
  ".mdb",
  ".dbf",
  ".ldf",
  ".mdf",

  // System/Configuration formats
  ".dll",
  ".sys",
  ".ini",
  ".cfg",
  ".inf",
  ".reg",
  ".vbs",
  ".ps1",
  ".ksh",

  // Miscellaneous binary formats
  ".dat",
  ".pkg",
  ".deb",
  ".rpm",

  // Backup formats
  ".bak",
  ".tmp",
  ".old",
  ".bkp",
  ".backup",
  ".swp",

  // Other formats not typically containing text content
  ".log",
  ".swf",
  ".xpi",
  ".crx",
  ".pem",
  ".crt",
  ".key",
  ".der",
  ".csr",
  ".pfx",
  ".p12",
]);
