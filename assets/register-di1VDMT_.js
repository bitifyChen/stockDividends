import{p as i}from"./user-oT4FP4Xi.js";import{_ as p}from"./el-message-Mc3_iznV.js";import{a as m,r as d,h as f,o as _,b as y,c as r,y as a,f as s,w as x,M as o,E as l,Q as g,e as h}from"./index-fYJhQfop.js";const v={class:"p-[20px] w-full"},b=s("div",{class:"font-black text-[48px] text-[var(--main-primary-color)]"},[s("div",{class:"text-center"},"Stock!")],-1),w={class:"flex justify-end"},k={__name:"register",setup(S){const n=m(()=>[{name:"name",label:"姓名",type:"text",cssStyle:!0,rules:[{required:!0,message:"姓名为必填项"}]},{name:"username",label:"帳號",type:"text",cssStyle:!0,rules:[{required:!0,message:"帐号为必填项"}]},{name:"password",label:"密碼",type:"password",cssStyle:!0,rules:[{required:!0,message:"密码为必填项"}]},{name:"rePassword",label:"確認密码",type:"password",cssStyle:!0,rules:[{required:!0,message:"密码为必填项"}]}]),e=d({}),c=()=>{e.value.password!==e.value.rePassword&&l({message:"兩次輸入的密碼不相同",type:"error",plain:!0}),i(e.value).then(t=>{t.status===200&&(l({message:"註冊成功",type:"success",plain:!0}),g.push({path:"/login"}))})};return(t,q)=>{const u=f("router-link");return _(),y("div",v,[b,r(p,{fields:a(n),parentForm:a(e),submitText:"註冊",onSubmitFn:c,class:"form"},null,8,["fields","parentForm"]),s("div",w,[r(u,{to:"/login",class:"text-[var(--main-primary-color)]"},{default:x(()=>[h("有帳號嗎，前往登入")]),_:1})])])}}};typeof o=="function"&&o(k);export{k as default};
