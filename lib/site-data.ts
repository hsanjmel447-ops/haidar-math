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
    { id: 'l11', title: 'القطع الناقص – الدرس الأول', youtubeUrl: 'https://youtu.be/R9aPew7Doio' },
  { id: 'l12', title: 'القطع الناقص – الدرس الثاني', youtubeUrl: 'https://youtu.be/AqAe9FZO31o' },
  { id: 'l13', title: 'القطع الناقص – الدرس الثالث', youtubeUrl: 'https://youtu.be/mWSqOweVQUc' },
  { id: 'l14', title: 'القطع الناقص – الدرس الرابع', youtubeUrl: 'https://youtu.be/r731PevGb4g' },
    { id: 'l15', title: 'القطع الزائد – الدرس الأول', youtubeUrl: 'https://youtu.be/3Bb26SvoEg0' },
      { id: 'l16', title: 'المشتقة – الدرس الأول', youtubeUrl: 'https://www.youtube.com/live/b8EaGVeY2sM' },
  { id: 'l17', title: 'المشتقة – الدرس الثاني', youtubeUrl: 'https://www.youtube.com/live/EGlL0MTZ9Nw' },
  { id: 'l18', title: 'المشتقة – الدرس الثالث', youtubeUrl: 'https://www.youtube.com/live/nmMPQlu-mD8' },
  { id: 'l19', title: 'المشتقة – الدرس الرابع', youtubeUrl: 'https://www.youtube.com/live/mcmL8ZcBbAk' },
  { id: 'l20', title: 'المشتقة – الدرس الخامس', youtubeUrl: 'https://www.youtube.com/live/VqBcEUQRo3E' },
  { id: 'l21', title: 'المشتقة – الدرس السادس', youtubeUrl: 'https://www.youtube.com/live/Rp_rjV0QbdM' },
  { id: 'l22', title: 'المشتقة – الدرس السابع', youtubeUrl: 'https://www.youtube.com/live/S6Z_hpRDEQQ' },
  { id: 'l23', title: 'المشتقة – الدرس الثامن', youtubeUrl: 'https://www.youtube.com/live/eS_AMM4QSEw' },
  { id: 'l24', title: 'المشتقة – الدرس التاسع', youtubeUrl: 'https://www.youtube.com/live/7T6liKHCbFE' },
  { id: 'l25', title: 'المشتقة – الدرس العاشر', youtubeUrl: 'https://www.youtube.com/live/rQIqmacX4XE' },
  { id: 'l26', title: 'المشتقة – الدرس الحادي عشر', youtubeUrl: 'https://www.youtube.com/live/gBoQIe7iNm8' },
    { id: 'l27', title: 'التكامل – الدرس الأول', youtubeUrl: 'https://www.youtube.com/live/UaFG6t_I0go' },
  { id: 'l28', title: 'التكامل – الدرس الثاني', youtubeUrl: 'https://www.youtube.com/live/TdsnvrJwR8g' },
  { id: 'l29', title: 'التكامل – الدرس الثالث', youtubeUrl: 'https://www.youtube.com/live/ztcQS65UPSA' },
  { id: 'l30', title: 'التكامل – الدرس الرابع', youtubeUrl: 'https://www.youtube.com/live/L3_YgKF1UTo' },
  { id: 'l31', title: 'التكامل – الدرس الخامس', youtubeUrl: 'https://www.youtube.com/live/pIQAzbIhTpA' },
  { id: 'l32', title: 'التكامل – الدرس السادس', youtubeUrl: 'https://www.youtube.com/live/uRSe_PGyEoE' },
  { id: 'l33', title: 'التكامل – الدرس السابع', youtubeUrl: 'https://www.youtube.com/live/wfjAqC7Mrg4' },
  { id: 'l34', title: 'التكامل – الدرس الثامن', youtubeUrl: 'https://www.youtube.com/live/CewOk9O4wyI' },
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
