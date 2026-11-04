
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState('Loading admin access...');

  useEffect(() => {
    const loadAdmin = async () => {
      if (!supabase) {
        setMessage('Connect Supabase to use the admin dashboard.');
        return;
      }

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        setMessage('Please sign in first.');
        return;
      }

      const currentUser = authData.user;
      setUser(currentUser);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      const currentRole = profile?.role || 'customer';
      setRole(currentRole);

      if (currentRole !== 'admin') {
        setMessage('This account does not have administrator access.');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        setMessage('Unable to load orders.');
        return;
      }

      setRows(data || []);
      setMessage('');
    };

    loadAdmin().catch(() => setMessage('Something went wrong.'));
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f4ef] p-5 md:p-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-xl font-black">
          GenZTradeSphere
        </Link>

        <div className="mt-10">
          <p className="text-[#777]">STORE MANAGEMENT</p>
          <h1 className="mt-2 text-4xl font-black">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-[#777]">
            Manage wholesale orders and monitor store activity.
          </p>
        </div>

        {message ? (
          <div className="mt-8 rounded border bg-white p-5 text-sm">
            {message}
            {message === 'Please sign in first.' && (
              <Link href="/login" className="ml-2 underline">
                Sign in
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded border bg-white p-5">
                <p className="text-xs text-[#777]">ORDERS LOADED</p>
                <p className="mt-2 text-3xl font-black">{rows.length}</p>
              </div>

              <div className="rounded border bg-white p-5">
                <p className="text-xs text-[#777]">ADMIN ACCOUNT</p>
                <p className="mt-3 text-sm font-bold">{user?.email}</p>
              </div>

              <div className="rounded border bg-white p-5">
                <p className="text-xs text-[#777]">ACCESS ROLE</p>
                <p className="mt-2 text-3xl font-black">{role}</p>
              </div>
            </div>

            <div className="mt-8 overflow-x-auto rounded border bg-white">
              <div className="p-5 font-bold">Recent orders</div>
              <table className="w-full text-sm">
                <thead className="bg-[#f5f5f1] text-left">
                  <tr>
                    {['Reference', 'Customer', 'Total', 'Payment', 'Status'].map(
                      (heading) => (
                        <th key={heading} className="p-4">{heading}</th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="p-4 font-bold">{row.order_reference}</td>
                      <td className="p-4">
                        {row.customer_name}
                        <div className="text-xs text-[#888]">
                          {row.customer_email}
                        </div>
                      </td>
                      <td className="p-4">
                        ₹{Number(row.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">{row.payment_status}</td>
                      <td className="p-4">{row.order_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rows.length === 0 && (
                <p className="p-5 text-sm text-[#777]">No orders yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
