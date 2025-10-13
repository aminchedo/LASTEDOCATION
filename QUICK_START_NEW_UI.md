# 🚀 Quick Start - New UI/UX Components

## For Developers: Start Using the New UI System in 5 Minutes

---

## 📦 1. Import the Components

```tsx
// Icons
import { Icons } from '@/shared/components/icons';

// UI Components
import { 
  LoadingState, 
  EmptyState, 
  ErrorState,
  StatusBadge,
  QuickActions,
  Button 
} from '@/shared/components/ui';

// Model Components
import { ModelCard } from '@/shared/components/models/ModelCard';

// Animations
import { motion } from 'framer-motion';
import { fadeIn, slideUp } from '@/shared/animations';
```

---

## 🎨 2. Use Icons Everywhere

```tsx
// Before
<Brain className="w-5 h-5" />

// After (consistent, type-safe)
<Icons.brain className="w-5 h-5 text-primary" />
<Icons.download className="w-4 h-4" />
<Icons.settings className="w-6 h-6" />
```

**50+ Icons Available:**
brain, cpu, database, download, upload, play, pause, refresh, settings, plus, check, error, warning, info, and more!

---

## 🔄 3. Add Loading States

```tsx
// Before
{loading && <div>Loading...</div>}

// After (professional)
{loading && <LoadingState message="در حال بارگذاری..." />}

// Or in buttons
<Button loading={isSubmitting} onClick={handleSubmit}>
  ذخیره
</Button>
```

---

## 📭 4. Show Empty States

```tsx
// Before
{data.length === 0 && <p>No data</p>}

// After (helpful and actionable)
{data.length === 0 && (
  <EmptyState
    icon="database"
    title="هیچ مدلی نصب نشده"
    description="برای شروع، یک مدل دانلود کنید"
    action={{
      label: 'مشاهده کاتالوگ',
      onClick: () => navigate('/catalog')
    }}
  />
)}
```

---

## ❌ 5. Handle Errors Better

```tsx
// Before
{error && <div className="text-red-500">{error.message}</div>}

// After (user-friendly)
{error && (
  <ErrorState
    title="خطا در بارگذاری"
    description={error.message}
    action={{
      label: 'تلاش مجدد',
      onClick: handleRetry
    }}
  />
)}
```

---

## 🏷️ 6. Add Status Badges

```tsx
// Show status visually
<StatusBadge status="success" label="نصب شده" />
<StatusBadge status="loading" label="در حال دانلود" />
<StatusBadge status="error" label="خطا" />
```

---

## ⚡ 7. Quick Actions in Headers

```tsx
const quickActions = [
  {
    id: 'refresh',
    icon: 'refresh' as const,
    label: 'به‌روزرسانی',
    onClick: handleRefresh,
  },
  {
    id: 'new',
    icon: 'plus' as const,
    label: 'جدید',
    onClick: handleNew,
    variant: 'primary' as const,
  },
];

<QuickActions actions={quickActions} />
```

---

## 🎬 8. Add Smooth Animations

```tsx
// Fade in on mount
<motion.div {...fadeIn}>
  <Card>Content</Card>
</motion.div>

// Slide up
<motion.div {...slideUp}>
  <Alert>Notice</Alert>
</motion.div>

// Stagger children
<motion.div variants={staggerContainer} initial="initial" animate="animate">
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>
      <Card>{item.title}</Card>
    </motion.div>
  ))}
</motion.div>
```

---

## 📝 9. Use Typography Classes

```tsx
// Before
<h1 className="text-3xl font-bold">Title</h1>

// After (consistent scale)
<h1 className="text-h1">Title</h1>
<h2 className="text-h2">Subtitle</h2>
<p className="text-body">Paragraph</p>
<span className="text-caption">Small text</span>
```

---

## 📐 10. Use Spacing Classes

```tsx
// Page container
<div className="container-padding">
  {/* Your content */}
</div>

// Card grid
<div className="grid-cards">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</div>

// Flex utilities
<div className="flex-between">
  <h1>Title</h1>
  <Button>Action</Button>
</div>
```

---

## 📦 11. Professional Model Cards

```tsx
<ModelCard
  model={{
    id: 'model-1',
    name: 'Persian TTS Male',
    type: 'tts',
    size: '2.1 GB',
    description: 'مدل تبدیل متن به گفتار',
    status: 'installed'
  }}
  onUse={(id) => handleUse(id)}
  onDelete={(id) => handleDelete(id)}
/>
```

---

## 🎯 Complete Page Example

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/shared/components/icons';
import { LoadingState, EmptyState, QuickActions } from '@/shared/components/ui';
import { fadeIn, staggerContainer, staggerItem } from '@/shared/animations';

export function MyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const quickActions = [
    {
      id: 'refresh',
      icon: 'refresh' as const,
      label: 'به‌روزرسانی',
      onClick: handleRefresh,
    },
  ];

  if (loading) {
    return <LoadingState message="در حال بارگذاری..." />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon="database"
        title="داده‌ای یافت نشد"
        action={{ label: 'افزودن', onClick: handleAdd }}
      />
    );
  }

  return (
    <motion.div {...fadeIn} className="container-padding">
      {/* Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 className="text-h1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex-center">
              <Icons.database className="w-6 h-6 text-primary" />
            </div>
            عنوان صفحه
          </h1>
          <p className="text-body text-muted-foreground">توضیحات</p>
        </div>
        <QuickActions actions={quickActions} />
      </div>

      {/* Content Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid-cards"
      >
        {data.map((item) => (
          <motion.div key={item.id} variants={staggerItem}>
            <Card>
              <CardHeader>
                <h3 className="text-h4">{item.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-body">{item.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
```

---

## 📚 Full Documentation

For complete API documentation, examples, and troubleshooting:
- See `client/UI_UX_ENHANCEMENT_GUIDE.md`
- See `UI_UX_IMPLEMENTATION_SUMMARY.md`
- See `UI_UX_IMPLEMENTATION_CHECKLIST.md`

---

## ✅ Remember

1. **Always show loading states** - Users should know what's happening
2. **Handle empty states** - Guide users when there's no data
3. **Use consistent icons** - Import from `@/shared/components/icons`
4. **Apply typography classes** - Use text-h1, text-body, etc.
5. **Use spacing utilities** - container-padding, grid-cards, flex-between
6. **Add animations wisely** - Enhance, don't distract
7. **Test responsively** - Check mobile, tablet, desktop

---

## 🎉 You're Ready!

The new UI system is production-ready and easy to use. Start enhancing your pages today!

**Happy coding!** 🚀
