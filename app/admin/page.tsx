
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState('Loading admin access…');

  useEffect(() => {
    const loadAdmin = async () => {
      if (!supabase) {
        setMessage('Connect Supabase and create an admin profile to use this dashboard.');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setMessage('Please sign in first.');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setRole(profile?.role || 'customer');

      if (profile?.role !== 'admin') {
        setMessage('This account does not have administrator access.');
        return;
      }

      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setRows(data || []);
      setMessage('');
    };

    loadAdmin().catch(() => {
      setMessage('Unable to load the admin dashboard. Please try again.');
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f4ef] p-5 md:p-10">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="font-black text-xl">
          GenZTradeSphere
        </Link>

        <div className="mt-10">
          <div className="eyebrow text-[#777]">STORE MANAGEMENT</div>
          <h1 className="text-4xl font-black tracking-tight mt-2">
            Admin dashboard
          </h1>
          <p className="text-sm text-[#777] mt-2">
            Manage retail orders and monitor store activity.
          </p>
        </div>

        {message ? (
          <div className="bg-white border rounded p-5 mt-8 text-sm">
            {message}
            {message === 'Please sign in first.' && (
              <Link href="/login" className="underline ml-2">
                Sign in
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white border rounded p-5">
                <div className="text-xs text-[#777]">ORDERS LOADED</div>
                <div className="text-3xl font-black mt-2">{rows.length}</div>
              </div>

              <div className="bg-white border rounded p-5">
                <div className="text-xs text-[#777]">ADMIN ACCOUNT</div>
                <div className="text-sm font-bold mt-3">{user?.email}</div>
              </div>

              <div className="bg-white border rounded p-5">
                <div className="text-xs text-[#777]">ACCESS ROLE</div>
                <div className="text-3xl font-black mt-2">{role}</div>
              </div>
            </div>

            <div className="bg-white border rounded mt-8 overflow-x-auto">
              <div className="p-5 font-bold">Recent orders</div>

              <table className="w-full text-sm">
                <thead className="bg-[#f5f5f1] text-left">
                  <tr>
                    {['Reference', 'Customer', 'Total', 'Payment', 'Status'].map((item) => (
                      <th key={item} className="p-4">{item}</th>
                    ))}
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
