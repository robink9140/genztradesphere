import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { demoProducts } from '@/lib/products';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export async function POST(req: Request){
 try {
  if(!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return NextResponse.json({error:'Razorpay is not configured on the server.'},{status:503});
  const body=await req.json(); const items=body.items as {product_id:string;quantity:number}[];
  if(!Array.isArray(items)||items.length===0) return NextResponse.json({error:'Your cart is empty.'},{status:400});
  let catalog=demoProducts;
  if(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY){const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);const {data}=await db.from('products').select('id,name,price,moq').in('id',items.map(i=>i.product_id)).eq('is_active',true);if(data?.length)catalog=data as any;}
  let amount=0;
  for(const item of items){const p=catalog.find(x=>x.id===item.product_id);if(!p||!Number.isInteger(item.quantity)||item.quantity<p.moq||item.quantity>10000)return NextResponse.json({error:'Invalid product or quantity. Please refresh your cart.'},{status:400});amount+=p.price*item.quantity;}
  if(!Number.isSafeInteger(amount)||amount<=0||amount>500000) return NextResponse.json({error:'Order total is outside the supported range.'},{status:400});
  const razorpay=new Razorpay({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET});
  const order=await razorpay.orders.create({amount:amount*100,currency:'INR',receipt:`gts_${Date.now()}`,notes:{store:'GenZTradeSphere'}});
  return NextResponse.json({id:order.id,amount:order.amount,currency:order.currency});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to create payment order.'},{status:500});}
}
