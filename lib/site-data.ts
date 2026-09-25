export const siteConfig = {
  name: 'حيدر محمد رياضيات',
  teacher: 'الأستاذ حيدر محمد',
  tagline: 'رياضيات السادس المهني بطريقة أوضح وأسهل',
  // أضف روابطك الحقيقية هنا لاحقاً (اتركها '#' مؤقتاً)
  social: {
    youtube: 'https://youtube.com/@h__rn2',
    telegram: 'https://t.me/fnon_6383',
  },
}

export type NavItem = { label: string; href: string }

export const navItems: NavItem[] = [
  { label: 'الرئيسية', href: '#home' },
  { label: 'الدورات', href: '#courses' },
  { label: 'المحاضرات المجانية', href: '#lectures' },
  { label: 'الأسئلة الوزارية', href: '#ministry' },
  { label: 'الملازم والملخصات', href: '#materials' },
  { label: 'نتائج الطلاب', href: '#results' },
  { label: 'عن الأستاذ', href: '#about' },
  { label: 'تواصل معنا', href: '#contact' },
]

// ——— الدورات: منهج السادس المهني منظّم حسب الفصول ———
export type Chapter = {
  id: string
  order: string
  title: string
  topics: string[]
}

export const chapters: Chapter[] = [
  {
    id: 'ch1',
    order: 'الفصل الأول',
    title: 'الدائرة والقطوع المخروطية',
    topics: ['الدائرة', 'القطع المكافئ', 'القطع الناقص', 'القطع الزائد'],
  },
  {
    id: 'ch2',
    order: 'الفصل الثاني',
    title: 'المشتقة وتطبيقاتها',
    topics: [
      'النقاط الحرجة ومناطق التزايد والتناقص',
      'التطبيق الفيزيائي',
      'التطبيق الاقتصادي',
    ],
  },
  {
    id: 'ch3',
    order: 'الفصل الثالث',
    title: 'التكامل',
    topics: ['مقدمة في التكامل وتطبيقاته'],
  },
]

// ——— المحاضرات المجانية: بطاقات Placeholder تُربط لاحقاً بفيديوهات يوتيوب حقيقية ———
export type Lecture = {
  id: string
  title: string
  // أضف رابط اليوتيوب الحقيقي هنا لاحقاً (اتركه '' حالياً)
  youtubeUrl: string
}
export const lectures: Lecture[] = [
  { id: 'l1', title: 'الدائرة – الدرس الأول', youtubeUrl: 'https://youtu.be/6Qx1HLkDcds' },
  { id: 'l2', title: 'الدائرة – الدرس الثاني', youtubeUrl: 'https://youtu.be/Jr_yg6Q8fcY' },
  { id: 'l3', title: 'الدائرة – الدرس الثالث', youtubeUrl: 'https://youtu.be/mQeNDd0VARo' },
  { id: 'l4', title: 'الدائرة – الدرس الرابع', youtubeUrl: 'https://youtu.be/TAODuKgaVHk' },
  { id: 'l5', title: 'الدائرة – الدرس الخامس', youtubeUrl: 'https://youtu.be/C5xW5aZrvTU' },
    { id: 'l6', title: 'القطع المكافئ – الدرس الأول', youtubeUrl: 'https://youtu.be/MZsaCxebCDk' },
  { id: 'l7', title: 'القطع المكافئ – الدرس الثاني', youtubeUrl: 'https://youtu.be/6GBFDfNyPs4' },
  { id: 'l8', title: 'القطع المكافئ – الدرس الثالث', youtubeUrl: 'https://youtu.be/tVVCEs_tJtE' },
  { id: 'l9', title: 'القطع المكافئ – الدرس الرابع', youtubeUrl: 'https://youtu.be/I5uS90wiZqo' },
  { id: 'l10', title: 'القطع المكافئ – الدرس الخامس', youtubeUrl: 'https://youtu.be/fAR_5buAQqI' },
]

// ——— الأسئلة الوزارية: مصنّفة حسب الموضوع ———
export type MinistryTopic = {
  id: string
  title: string
}

export const ministryTopics: MinistryTopic[] = [
  { id: 'circle', title: 'الدائرة' },
  { id: 'parabola', title: 'القطع المكافئ' },
  { id: 'ellipse', title: 'القطع الناقص' },
  { id: 'hyperbola', title: 'القطع الزائد' },
  { id: 'derivative', title: 'المشتقة' },
  { id: 'integral', title: 'التكامل' },
]

// ——— الملازم والملخصات ———
// كل عنصر يمثّل ملزمة أو ملخصاً. لإضافة ملف فعلي لاحقاً:
//   1) ضع ملف الـ PDF في مجلد public (مثلاً: public/pdfs/ملزمة-الفصل-الاول.pdf)
//   2) اكتب المسار في الحقل fileUrl (مثلاً: '/pdfs/ملزمة-الفصل-الاول.pdf')
//   3) عدّل title و description و coverImage حسب الحاجة
// اترك fileUrl فارغاً ('') ليظهر الزر معطّلاً بوضع "قريباً".
export type MaterialItem = {
  id: string
  title: string
  description: string
  // مسار صورة الغلاف داخل public (اتركه '' لعرض غلاف افتراضي)
  coverImage: string
  // مسار ملف الـ PDF داخل public (اتركه '' حتى يُرفع الملف)
  fileUrl: string
}

export type MaterialCategory = {
  id: string
  title: string
  description: string
  items: MaterialItem[]
}

export const materialCategories: MaterialCategory[] = [
  {
    id: 'chapters',
    title: 'ملازم الفصول',
    description: 'ملازم شاملة لكل فصل من فصول المنهج.',
    items: [
      {
        id: 'chapter-1-vocational',
        title: 'ملزمة الفصل الأول – الرياضيات',
        description: 'السادس المهني – فنون تطبيقية وزراعة | الدائرة، القطع المكافئ، القطع الناقص، والقطع الزائد. إعداد الأستاذ حيدر محمد.',
        coverImage: '/covers/chapter-1.jpg',
        fileUrl: '/pdfs/math-chapter-1-vocational.pdf',
      },
    ],
  },
  {
    id: 'laws',
    title: 'ملخصات القوانين',
    description: 'أهم القوانين والصيغ مجمّعة في ملخص واحد.',
    items: [],
  },
  {
    id: 'reviews',
    title: 'مراجعات سريعة',
    description: 'مراجعات مركزة قبل الامتحان.',
    items: [],
  },
  {
    id: 'exercises',
    title: 'أسئلة وتمارين',
    description: 'تمارين متنوعة مع أسئلة للتدريب.',
    items: [],
  },
]

// ——— نتائج الطلاب: تُضاف النتائج الحقيقية هنا لاحقاً ———
export type StudentResult = {
  id: string
  name: string
  detail: string
}

export const studentResults: StudentResult[] = []

// ——— نص التعريف بالأستاذ ———
export const aboutText =
  'الأستاذ حيدر محمد – مدرس رياضيات، أقدّم شرحاً مبسطاً ومنظماً لمادة الرياضيات لطلبة السادس المهني، مع التركيز على فهم الأفكار الأساسية والتدريب على الأسئلة الوزارية.'
