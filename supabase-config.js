// Supabase connection details for the Vending Dashboard.
// This is the PUBLIC anon key -- safe to ship in client-side code, but note
// Row Level Security is currently OFF on all tables, so this key can
// currently read AND write every table. Simon has explicitly chosen to
// leave this open while the site is still being built; revisit before
// sharing the live URL outside this build process (enable RLS with
// read-only policies for anon, move writes behind a server-side function).

export const SUPABASE_URL = 'https://byfwzrltmsooowvemzih.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Znd6cmx0bXNvb293dmVtemloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNTY3MTMsImV4cCI6MjA5OTczMjcxM30.UV35anDd2jG5IuALCYnwXYxrGHxfH598VA-BncDs1xI';
