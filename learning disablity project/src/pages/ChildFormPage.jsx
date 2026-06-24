import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, InputField, Card } from '../components/ui/index.jsx';
import { Navbar } from '../components/Layout/index.jsx';
import { useAppContext } from '../contexts/AppContext';
import { getAvatarEmoji } from '../utils/helpers.js';

const ChildFormPage = () => {
  const navigate = useNavigate();
  const { updateUserData } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    grade: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.age || formData.age < 5 || formData.age > 18) {
      newErrors.age = 'Age must be between 5 and 18';
    }
    if (!formData.grade.trim()) newErrors.grade = 'Grade is required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      updateUserData(formData);
      navigate('/assessment/test');
    } else {
      setErrors(newErrors);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4">
        <div className="container-custom">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="text-center mb-12">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4 inline-block"
              >
                👨‍🎓
              </motion.div>
              <h1 className="text-5xl font-bold text-dark mb-4">
                Let's Get Started!
              </h1>
              <p className="text-xl text-gray-600">
                Please tell us about your child so we can personalize the assessment.
              </p>
            </motion.div>

            {/* Form Card */}
            <Card className="p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Name Input */}
                <motion.div variants={itemVariants}>
                  <InputField
                    label="Child's Name"
                    placeholder="Enter child's name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                  />
                </motion.div>

                {/* Age Input */}
                <motion.div variants={itemVariants}>
                  <InputField
                    label="Age"
                    placeholder="Enter age (5-18)"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    error={errors.age}
                    min="5"
                    max="18"
                  />
                </motion.div>

                {/* Grade Input */}
                <motion.div variants={itemVariants}>
                  <label className="block text-gray-700 font-semibold mb-3 text-lg">
                    Grade / Class
                  </label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select grade</option>
                    <option value="Kindergarten">Kindergarten</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                  {errors.grade && (
                    <p className="text-error text-sm font-medium mt-2">{errors.grade}</p>
                  )}
                </motion.div>

                {/* Avatar Preview */}
                {formData.age && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center"
                  >
                    <div className="flex items-center gap-3 bg-gradient-to-r from-primary to-secondary bg-opacity-10 rounded-2xl px-6 py-4">
                      <span className="text-4xl">
                        {getAvatarEmoji(parseInt(formData.age))}
                      </span>
                      <p className="text-gray-700 font-semibold">
                        {formData.age} years old
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.div variants={itemVariants} className="pt-6">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    className="w-full"
                  >
                    Continue to Assessment →
                  </Button>
                </motion.div>
              </form>
            </Card>

            {/* Info Cards */}
            <motion.div
              variants={itemVariants}
              className="grid md:grid-cols-3 gap-6 mt-12"
            >
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-6 text-center shadow-soft"
              >
                <div className="text-3xl mb-3">⏱️</div>
                <p className="text-gray-700">
                  <span className="font-bold text-primary">30 mins</span> to complete all tests
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-6 text-center shadow-soft"
              >
                <div className="text-3xl mb-3">🎮</div>
                <p className="text-gray-700">
                  <span className="font-bold text-primary">Fun & Interactive</span> assessment experience
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-6 text-center shadow-soft"
              >
                <div className="text-3xl mb-3">🔒</div>
                <p className="text-gray-700">
                  <span className="font-bold text-primary">Secure & Private</span> data handling
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChildFormPage;
