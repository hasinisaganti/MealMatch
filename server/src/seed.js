import fs from 'fs'; import path from 'path'; import bcrypt from 'bcryptjs'; import { fileURLToPath } from 'url';
const dir=path.dirname(fileURLToPath(import.meta.url)); fs.mkdirSync(path.join(dir,'../data'),{recursive:true});
const hash=await bcrypt.hash('demo123',10);
const data={ users:[
 {id:'u_student',name:'Aarav Sharma',email:'student@mealmatch.test',password:hash,role:'student',preferences:{budget:4500,diet:'veg',spice:'medium',allergies:'Peanuts',location:'Koramangala, Bengaluru'}},
 {id:'u_cook1',name:'Anita’s Kitchen',email:'anita@mealmatch.test',password:hash,role:'provider',verified:true,location:'Koramangala, Bengaluru'},
 {id:'u_cook2',name:'Namma Tiffins',email:'namma@mealmatch.test',password:hash,role:'provider',verified:true,location:'HSR Layout, Bengaluru'},
 {id:'u_cook3',name:'Priya Home Foods',email:'priya@mealmatch.test',password:hash,role:'provider',verified:false,location:'Koramangala, Bengaluru'}],
 plans:[
 {id:'p1',providerId:'u_cook1',title:'Wholesome Veg Monthly',diet:'veg',price:4200,period:'monthly',mealsPerWeek:12,location:'Koramangala, Bengaluru',spice:'medium',rating:4.8,reviews:56,available:true,menu:['Mon: Rajma chawal','Tue: Sambar rice','Wed: Paneer curry','Thu: Dal khichdi','Fri: Veg pulao']},
 {id:'p2',providerId:'u_cook2',title:'Protein Power Weekly',diet:'eggetarian',price:1200,period:'weekly',mealsPerWeek:14,location:'HSR Layout, Bengaluru',spice:'medium',rating:4.6,reviews:38,available:true,menu:['Egg bhurji & roti','Chole rice','Egg curry','Veg biryani','Dal & sabzi']},
 {id:'p3',providerId:'u_cook1',title:'Comfort Non-Veg Monthly',diet:'non-veg',price:5100,period:'monthly',mealsPerWeek:12,location:'Koramangala, Bengaluru',spice:'mild',rating:4.7,reviews:29,available:true,menu:['Chicken curry','Fish masala','Dal fry','Chicken pulao','Veg thali']},
 {id:'p4',providerId:'u_cook3',title:'Budget Veg Weekly',diet:'veg',price:950,period:'weekly',mealsPerWeek:12,location:'Koramangala, Bengaluru',spice:'high',rating:4.3,reviews:12,available:true,menu:['Aloo gobi','Lemon rice','Dal tadka','Chole','Veg noodles']}],
 subscriptions:[{id:'s1',studentId:'u_student',planId:'p1',status:'active',startDate:'2026-09-15',nextMeal:'Tomorrow · Dinner'}],
 feedback:[{id:'f1',studentId:'u_student',planId:'p1',rating:5,comment:'Fresh, comforting and right on time!',date:'2026-09-16'}]
}; fs.writeFileSync(path.join(dir,'../data/db.json'),JSON.stringify(data,null,2)); console.log('Seeded demo data.');
