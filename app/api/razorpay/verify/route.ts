import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { demoProducts } from '@/lib/products';
export const runtime='nodejs';
export async function POST(req:Request){
 try{
  const body=await req.json();const secret=process.env.RAZORPAY_KEY_SECRET;
  if(!secret)return NextResponse.json({error:'Payment verification is not configured.'},{status:503});
  const {razorpay_order_id,razorpay_payment_id,razorpay_signature,customer,items}=body;
  if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature||!Array.isArray(items)||!customer?.email)return NextResponse.json({error:'Missing payment or order information.'},{status:400});
  const expected=crypto.createHmac('sha256',secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  const a=Buffer.from(expected);const b=Buffer.from(String(razorpay_signature));if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return NextResponse.json({error:'Payment signature could not be verified.'},{status:400});
  const ref=`GTS-${Date.now().toString().slice(-8)}`;
  if(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY){
   const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
   const ids=items.map((i:any)=>i.product_id);const {data:catalog}=await db.from('products').select('id,name,price,moq').in('id',ids).eq('is_active',true);
   if(!catalog||catalog.length!==new Set(ids).size)return NextResponse.json({error:'One or more products are no longer available.'},{status:400});
   let amount=0;const lines=[];for(const i of items){const p=catalog.find(x=>x.id===i.product_id);if(!p||!Number.isInteger(i.quantity)||i.quantity<p.moq)return NextResponse.json({error:'Invalid order quantity.'},{status:400});amount+=p.price*i.quantity;lines.push({product_id:p.id,product_name:p.name,quantity:i.quantity,unit_price:p.price,size:i.size,color:i.color});}
   const {error}=await db.from('orders').insert({order_reference:ref,customer_name:customer.name,customer_email:customer.email,customer_phone:customer.phone,company_name:customer.company||null,shipping_address:customer.address,payment_provider:'razorpay',payment_id:razorpay_payment_id,razorpay_order_id,total_amount:amount,currency:'INR',payment_status:'paid',order_status:'confirmed',items:lines});
   if(error)return NextResponse.json({error:'Payment verified, but order recording failed. Contact support with payment ID '+razorpay_payment_id+'.'},{status:500});
  }
  return NextResponse.json({ok:true,orderReference:ref});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to verify payment.'},{status:500});}
}
