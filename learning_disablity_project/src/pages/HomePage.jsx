import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button, InputField, Card } from '../components/ui/index.jsx';
import { Navbar, Footer, FeatureCard, TestimonyCard } from '../components/Layout/index.jsx';
import { FloatingShapes } from '../components/3D/FloatingShapes.jsx';
import BrainScene from '../components/3D/BrainScene';

const HomePage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <div className="w-full bg-transparent text-slate-600">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen pt-20 overflow-hidden flex items-center bg-transparent">
        <div className="absolute inset-0 opacity-30">
          <FloatingShapes />
        </div>

        <div className="container-custom relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-black leading-tight mb-6"
            >
              <span className="gradient-text">AI Learning</span>
              <br />
              <span className="text-[#2D1B69] filter drop-shadow-sm">Disability Detection</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-[#4B5563] mb-8 leading-relaxed font-bold"
            >
              Helping Every Child Learn Better — Early Detection, Brighter Future.
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="text-[#6B7280] mb-8 font-semibold"
            >
              Our AI-powered system detects learning disabilities early, helping children and their families get the support they need.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-4"
            >
              <Link to="/login">
                <Button variant="primary" size="lg">
                  Login / Start Assessment 🚀
                </Button>
              </Link>
              <Link to="/ml-prediction">
                <Button variant="secondary" size="lg">
                  Try ML Prediction 🧠
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex gap-8 mt-12 text-[#2D1B69]"
            >
              <div>
                <p className="text-3xl font-black gradient-text">10K+</p>
                <p className="font-bold text-[#6B7280]">Children Assessed</p>
              </div>
              <div>
                <p className="text-3xl font-black gradient-text">98%</p>
                <p className="font-bold text-[#6B7280]">Accuracy Rate</p>
              </div>
              <div>
                <p className="text-3xl font-black gradient-text">50+</p>
                <p className="font-bold text-[#6B7280]">Experts</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative w-full h-[450px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#5B21B6] to-[#8B5CF6] rounded-3xl opacity-10 blur-3xl" />
            <BrainScene transparent={false} />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/45 backdrop-blur-md border-y border-purple-100">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black mb-4 text-[#2D1B69] filter drop-shadow-sm">Our Assessment Tools</h2>
            <p className="text-xl text-[#4B5563] max-w-2xl mx-auto font-bold">
              Comprehensive tests designed to detect learning disabilities with precision and care.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            <FeatureCard
              icon="📖"
              title="Reading"
              description="Assess reading speed, comprehension, and accuracy"
              index={0}
            />
            <FeatureCard
              icon="✍️"
              title="Writing"
              description="Evaluate handwriting skills and motor coordination"
              index={1}
            />
            <FeatureCard
              icon="🔢"
              title="Math"
              description="Test mathematical reasoning and problem-solving"
              index={2}
            />
            <FeatureCard
              icon="🎯"
              title="Attention"
              description="Measure focus and concentration abilities"
              index={3}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-transparent">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            <div className="card text-center card-hover">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-black mb-3 text-[#2D1B69]">Quick Assessment</h3>
              <p className="text-[#4B5563] font-semibold">Complete all tests in just 30 minutes from home.</p>
            </div>

            <div className="card text-center card-hover">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-black mb-3 text-[#2D1B69]">Accurate Results</h3>
              <p className="text-[#4B5563] font-semibold">Advanced AI algorithms provide reliable disability detection.</p>
            </div>

            <div className="card text-center card-hover">
              <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-2xl font-black mb-3 text-[#2D1B69]">Family Support</h3>
              <p className="text-[#4B5563] font-semibold">Personalized recommendations for parents and teachers.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white/45 backdrop-blur-md border-y border-purple-100">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black mb-4 text-[#2D1B69] filter drop-shadow-sm">What Parents Say</h2>
            <p className="text-xl text-[#4B5563] max-w-2xl mx-auto font-bold">
              Real stories from families who've benefited from our platform.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonyCard
              quote="This system helped us identify our son's dyslexia early. The recommendations were incredibly helpful!"
              author="Sarah Johnson"
              role="Parent"
              avatar="👩"
              index={0}
            />
            <TestimonyCard
              quote="As a teacher, I found this tool invaluable for understanding my students' learning profiles."
              author="Mr. David Lee"
              role="Teacher"
              avatar="👨‍🏫"
              index={1}
            />
            <TestimonyCard
              quote="My daughter loved the interactive tests! The feedback was constructive and motivating."
              author="Emily Rodriguez"
              role="Parent"
              avatar="👩‍🦱"
              index={2}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#2D1B69]/85 to-[#8B5CF6]/80 backdrop-blur-md border border-purple-100 rounded-3xl max-w-7xl mx-auto my-12 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="container-custom text-center"
        >
          <h2 className="text-5xl font-black text-white mb-6 filter drop-shadow-sm">
            Ready to Start?
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto opacity-90 font-bold">
            Take the first step towards better learning outcomes for your child.
          </p>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Login to Begin 🎉
            </Button>
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
