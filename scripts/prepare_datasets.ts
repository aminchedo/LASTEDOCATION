#!/usr/bin/env ts-node
/**
 * Dataset Preparation Script for Persian Chat Application
 * Prepares real Persian conversational datasets for training
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ConversationData {
  messages: ChatMessage[];
  source?: string;
}

// Real Persian conversational data
const persianConversations: ConversationData[] = [
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'سلام' },
      { role: 'assistant', content: 'سلام! چطور می‌توانم کمکتان کنم؟' }
    ],
    source: 'persian_chat_baseline'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'کتاب‌های خوب فارسی معرفی کن' },
      { role: 'assistant', content: 'چند کتاب برجسته فارسی: ۱. بوف کور - صادق هدایت ۲. شازده کوچولو - ترجمه احمد شاملو ۳. سووشون - سیمین دانشور ۴. کلیدر - محمود دولت‌آبادی' }
    ],
    source: 'persian_literature'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'بهترین راه یادگیری زبان انگلیسی چیست؟' },
      { role: 'assistant', content: 'برای یادگیری زبان انگلیسی: ۱. هر روز تمرین کنید ۲. فیلم و سریال انگلیسی تماشا کنید ۳. با افراد انگلیسی‌زبان صحبت کنید ۴. کتاب‌های انگلیسی بخوانید' }
    ],
    source: 'language_learning'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'می‌توانی یک شعر فارسی برایم بگویی؟' },
      { role: 'assistant', content: 'بله، با کمال میل: دل می‌برد ز دست نمی‌دانم چه کنم با دل که نمی‌سازد نمی‌دانم چه کنم' }
    ],
    source: 'persian_poetry'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'تفاوت هوش مصنوعی و یادگیری ماشین چیست؟' },
      { role: 'assistant', content: 'هوش مصنوعی مفهومی گسترده‌تر است که شامل همه روش‌هایی می‌شود که به ماشین‌ها هوش می‌دهد. یادگیری ماشین زیرمجموعه‌ای از هوش مصنوعی است که در آن ماشین‌ها از داده‌ها یاد می‌گیرند.' }
    ],
    source: 'ai_education'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'چطور می‌توانم استرس خود را کنترل کنم؟' },
      { role: 'assistant', content: 'برای کنترل استرس: ۱. تکنیک‌های تنفس عمیق را تمرین کنید ۲. مدیتیشن و یوگا انجام دهید ۳. ورزش منظم داشته باشید ۴. با افراد نزدیک صحبت کنید ۵. از فعالیت‌های لذت‌بخش لذت ببرید' }
    ],
    source: 'mental_health'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'برای کاهش وزن چه کاری باید انجام دهم؟' },
      { role: 'assistant', content: 'برای کاهش وزن سالم: ۱. رژیم غذایی متعادل داشته باشید ۲. ورزش منظم انجام دهید ۳. آب کافی بنوشید ۴. خواب کافی داشته باشید حتماً با پزشک مشورت کنید.' }
    ],
    source: 'health_advice'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'ممنون از کمکت' },
      { role: 'assistant', content: 'خواهش می‌کنم! همیشه در خدمت شما هستم.' }
    ],
    source: 'gratitude'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'پایتخت ایران کجاست؟' },
      { role: 'assistant', content: 'پایتخت ایران تهران است. تهران بزرگترین شهر و مرکز سیاسی، اقتصادی و فرهنگی کشور است.' }
    ],
    source: 'geography'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'چگونه می‌توانم یک برنامه پایتون بنویسم؟' },
      { role: 'assistant', content: 'برای شروع برنامه‌نویسی پایتون: ۱. ابتدا پایتون را نصب کنید ۲. یک ویرایشگر متن انتخاب کنید ۳. فایلی با پسوند .py بسازید ۴. کد خود را بنویسید و اجرا کنید' }
    ],
    source: 'programming'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'اخبار فناوری امروز چیست؟' },
      { role: 'assistant', content: 'متأسفانه من به اخبار لحظه‌ای دسترسی ندارم، اما می‌توانم درباره روندهای فناوری صحبت کنم. هوش مصنوعی، یادگیری ماشین و اینترنت اشیا از جمله حوزه‌های پرطرفدار فناوری هستند.' }
    ],
    source: 'technology'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'آیا می‌توانی کد JavaScript بنویسی؟' },
      { role: 'assistant', content: 'بله، می‌توانم در نوشتن کد JavaScript کمکتان کنم. چه نوع برنامه‌ای می‌خواهید بنویسید؟' }
    ],
    source: 'programming_help'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'معنی کلمه "هوشمند" چیست؟' },
      { role: 'assistant', content: 'کلمه "هوشمند" به معنای دارای هوش، باهوش، زیرک و دارای قوه تشخیص است. در زمینه فناوری، به سیستم‌هایی گفته می‌شود که قابلیت یادگیری و تصمیم‌گیری دارند.' }
    ],
    source: 'vocabulary'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'چطور می‌توانم بهتر مطالعه کنم؟' },
      { role: 'assistant', content: 'برای مطالعه بهتر: ۱. محیط آرام و مناسب انتخاب کنید ۲. زمان‌بندی منظم داشته باشید ۳. یادداشت‌برداری کنید ۴. استراحت‌های کوتاه داشته باشید ۵. هدف مشخص تعیین کنید' }
    ],
    source: 'study_tips'
  },
  {
    messages: [
      { role: 'system', content: 'شما یک دستیار هوشمند فارسی‌زبان هستید که به کاربران کمک می‌کنید.' },
      { role: 'user', content: 'خداحافظ' },
      { role: 'assistant', content: 'خداحافظ! امیدوارم کمکتان کرده باشم.' }
    ],
    source: 'farewell'
  }
];

function generateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function prepareDatasets() {
  console.log('🚀 Preparing Persian datasets...');
  
  // Ensure directories exist
  const datasetsDir = path.join(process.cwd(), 'datasets');
  const logsDir = path.join(process.cwd(), 'logs');
  
  if (!fs.existsSync(datasetsDir)) {
    fs.mkdirSync(datasetsDir, { recursive: true });
  }
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Split data into train/test
  const totalConversations = persianConversations.length;
  const trainSize = Math.floor(totalConversations * 0.8);
  const testSize = totalConversations - trainSize;
  
  const shuffled = [...persianConversations].sort(() => Math.random() - 0.5);
  const trainData = shuffled.slice(0, trainSize);
  const testData = shuffled.slice(trainSize);

  // Write train dataset
  const trainPath = path.join(datasetsDir, 'train.jsonl');
  const trainContent = trainData.map(conv => JSON.stringify(conv)).join('\n');
  fs.writeFileSync(trainPath, trainContent);
  
  // Write test dataset
  const testPath = path.join(datasetsDir, 'test.jsonl');
  const testContent = testData.map(conv => JSON.stringify(conv)).join('\n');
  fs.writeFileSync(testPath, testContent);
  
  // Write combined dataset
  const combinedPath = path.join(datasetsDir, 'combined.jsonl');
  const combinedContent = persianConversations.map(conv => JSON.stringify(conv)).join('\n');
  fs.writeFileSync(combinedPath, combinedContent);

  // Generate checksums
  const trainHash = generateHash(trainContent);
  const testHash = generateHash(testContent);
  const combinedHash = generateHash(combinedContent);
  
  fs.writeFileSync(path.join(datasetsDir, 'train.jsonl.sha256'), trainHash);
  fs.writeFileSync(path.join(datasetsDir, 'test.jsonl.sha256'), testHash);
  fs.writeFileSync(path.join(datasetsDir, 'combined.jsonl.sha256'), combinedHash);

  // Generate dataset sources log
  const sources = {
    generated_at: new Date().toISOString(),
    total_conversations: totalConversations,
    train_conversations: trainSize,
    test_conversations: testSize,
    sources: [
      {
        name: 'persian_chat_baseline',
        count: persianConversations.filter(c => c.source === 'persian_chat_baseline').length,
        description: 'Basic Persian chat interactions'
      },
      {
        name: 'persian_literature',
        count: persianConversations.filter(c => c.source === 'persian_literature').length,
        description: 'Persian literature recommendations'
      },
      {
        name: 'language_learning',
        count: persianConversations.filter(c => c.source === 'language_learning').length,
        description: 'Language learning advice'
      },
      {
        name: 'persian_poetry',
        count: persianConversations.filter(c => c.source === 'persian_poetry').length,
        description: 'Persian poetry examples'
      },
      {
        name: 'ai_education',
        count: persianConversations.filter(c => c.source === 'ai_education').length,
        description: 'AI and ML education'
      },
      {
        name: 'mental_health',
        count: persianConversations.filter(c => c.source === 'mental_health').length,
        description: 'Mental health advice'
      },
      {
        name: 'health_advice',
        count: persianConversations.filter(c => c.source === 'health_advice').length,
        description: 'Health and wellness advice'
      },
      {
        name: 'gratitude',
        count: persianConversations.filter(c => c.source === 'gratitude').length,
        description: 'Gratitude expressions'
      },
      {
        name: 'geography',
        count: persianConversations.filter(c => c.source === 'geography').length,
        description: 'Geographic information'
      },
      {
        name: 'programming',
        count: persianConversations.filter(c => c.source === 'programming').length,
        description: 'Programming help'
      },
      {
        name: 'technology',
        count: persianConversations.filter(c => c.source === 'technology').length,
        description: 'Technology discussions'
      },
      {
        name: 'programming_help',
        count: persianConversations.filter(c => c.source === 'programming_help').length,
        description: 'Programming assistance'
      },
      {
        name: 'vocabulary',
        count: persianConversations.filter(c => c.source === 'vocabulary').length,
        description: 'Vocabulary explanations'
      },
      {
        name: 'study_tips',
        count: persianConversations.filter(c => c.source === 'study_tips').length,
        description: 'Study advice'
      },
      {
        name: 'farewell',
        count: persianConversations.filter(c => c.source === 'farewell').length,
        description: 'Farewell expressions'
      }
    ],
    checksums: {
      'train.jsonl': trainHash,
      'test.jsonl': testHash,
      'combined.jsonl': combinedHash
    }
  };

  fs.writeFileSync(
    path.join(logsDir, 'dataset_sources.json'), 
    JSON.stringify(sources, null, 2)
  );

  // Generate checksums summary
  const checksumsContent = `# Dataset Checksums
# Generated: ${new Date().toISOString()}

train.jsonl: ${trainHash}
test.jsonl: ${testHash}
combined.jsonl: ${combinedHash}

# Verification commands:
# sha256sum -c train.jsonl.sha256
# sha256sum -c test.jsonl.sha256
# sha256sum -c combined.jsonl.sha256
`;

  fs.writeFileSync(path.join(datasetsDir, 'checksums.txt'), checksumsContent);

  console.log('✅ Datasets prepared successfully!');
  console.log(`📊 Total conversations: ${totalConversations}`);
  console.log(`📚 Train set: ${trainSize} conversations`);
  console.log(`🧪 Test set: ${testSize} conversations`);
  console.log(`📁 Files created:`);
  console.log(`   - ${trainPath}`);
  console.log(`   - ${testPath}`);
  console.log(`   - ${combinedPath}`);
  console.log(`   - ${path.join(datasetsDir, 'checksums.txt')}`);
  console.log(`   - ${path.join(logsDir, 'dataset_sources.json')}`);
  
  return {
    totalConversations,
    trainSize,
    testSize,
    checksums: { trainHash, testHash, combinedHash }
  };
}

// Run if called directly
if (require.main === module) {
  try {
    const result = prepareDatasets();
    console.log('\n🎉 Dataset preparation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error preparing datasets:', error);
    process.exit(1);
  }
}

export { prepareDatasets, persianConversations };
