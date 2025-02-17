"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Text,
  Link as ChakraLink,
  Divider,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  FormErrorMessage,
  FormHelperText,
  Progress,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

// パスワードバリデーション
import { validatePassword } from "@/utils/passwordValidation";

// アイコン
import {
  FaGoogle,
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
} from "react-icons/fa";

// Framer Motion 用ラップコンポーネント
const MotionBox = motion(Box);

// メールアドレスの正規表現
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();

  // ========= 入力フィールドの状態 =========
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordScore, setPasswordScore] = useState(0);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  // ========= その他の状態管理 =========
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // フォーム送信後／フィールドが触れられたかどうか
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  // ========= パスワード表示トグル =========
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  // ========= リアルタイムバリデーション =========
  useEffect(() => {
    // Email形式チェック
    if (email.length > 0 && !emailRegex.test(email)) {
      setEmailError(t("invalidEmailFormat")); // "メールアドレスの形式が正しくありません"
    } else {
      setEmailError("");
    }

    // Passwordバリデーション
    if (password.length > 0) {
      const { error, score } = validatePassword(password, t);
      setPasswordError(error);
      setPasswordScore(score);
    } else {
      setPasswordError("");
      setPasswordScore(0);
    }

    // Confirm Password チェック
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError(t("passwordMismatch")); // "パスワードが一致しません"
    } else {
      setConfirmPasswordError("");
    }

    // Name チェック: フォーム送信またはフィールドが触れられた場合のみ
    if ((nameTouched || hasSubmitted) && name.length === 0) {
      setNameError(t("nameRequired")); // "名前は必須です"
    } else {
      setNameError("");
    }
  }, [email, password, confirmPassword, name, nameTouched, hasSubmitted, t]);

  // ========= フォーム送信処理 =========
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setHasSubmitted(true);

    if (!nameTouched) {
      setNameTouched(true);
    }

    // クライアントサイドバリデーション
    if (emailError || passwordError || confirmPasswordError || nameError) {
      toast({
        title: t("inputErrorTitle"),
        description: t("fixFormErrors"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // 必須項目が空ならエラー
    if (!email || !password || !confirmPassword || !name) {
      toast({
        title: t("inputErrorTitle"),
        description: t("missingRequiredFields"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // サーバーへ登録リクエスト
      const res = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword, name }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        throw new Error(data.error || t("registerFailedDefaultDesc"));
      }

      toast({
        title: t("registerSuccessTitle"),
        description: t("registerSuccessDesc"),
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // 登録成功後、ログインページへ遷移（ロケール付き）
      router.push(`/${locale}/auth/login`);
    } catch (err: unknown) {
      setIsLoading(false);
      let errorMessage = "";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = String(err);
      }
      toast({
        title: t("registerFailedTitle"),
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }

  // Googleアカウントで登録
  async function handleGoogleSignup() {
    setIsLoading(true);
    await signIn("google", { callbackUrl: `/${locale}/` });
  }

  // パスワード強度バーのパーセンテージ (0~4 -> 0~100%)
  const passwordStrengthPercent = (passwordScore / 4) * 100;

  // パスワード強度の文言（レベル）例
  const passwordStrengthLevels = [
    t("passwordStrengthLevel0"), // "非常に弱い" 等
    t("passwordStrengthLevel1"),
    t("passwordStrengthLevel2"),
    t("passwordStrengthLevel3"),
    t("passwordStrengthLevel4"),
  ];

  // フォームのアニメーション
  const formVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-tr, teal.300, blue.200, white)"
      py={[8, 12]}
      px={4}
    >
      <Heading
        textAlign="center"
        color="white"
        mb={[6, 10]}
        fontSize={["3xl", "4xl", "5xl"]}
        textShadow="1px 1px 2px rgba(0,0,0,0.3)"
      >
        {t("registerTitle")} {/* "新規登録"など */}
      </Heading>

      <Flex justify="center" align="center">
        <MotionBox
          maxW="md"
          w="full"
          bg="white"
          p={[6, 8]}
          borderRadius="lg"
          boxShadow="2xl"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <Heading
            as="h2"
            fontSize="xl"
            mb={4}
            textAlign="center"
            color="gray.700"
          >
            {t("registerTitle")}
          </Heading>

          <form onSubmit={handleRegister}>
            {/* メール */}
            <FormControl mb={4} isInvalid={!!emailError}>
              <FormLabel fontWeight="bold">{t("emailLabel")}</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaEnvelope color="gray.400" />
                </InputLeftElement>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  variant="outline"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </InputGroup>
              {emailError && (
                <FormErrorMessage>{emailError}</FormErrorMessage>
              )}
            </FormControl>

            {/* パスワード */}
            <FormControl mb={4} isInvalid={!!passwordError}>
              <FormLabel fontWeight="bold">{t("passwordLabel")}</FormLabel>

              {/* ここでパスワード要件を提示する */}
              <FormHelperText mb={1} color="gray.500">
                {t("passwordRequirementHint")}
                {/* 例: "パスワードは8文字以上で、大文字・数字・記号を少なくとも1つ含む必要があります。" */}
              </FormHelperText>

              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaLock color="gray.400" />
                </InputLeftElement>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")} 
                  // 例: "パスワードを入力"
                  variant="outline"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <InputRightElement>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {passwordError && (
                <FormErrorMessage>{passwordError}</FormErrorMessage>
              )}
            </FormControl>

            {/* パスワード強度バー */}
            {password.length > 0 && (
              <Box mb={4}>
                <Text fontSize="sm" color="gray.600">
                  {t("passwordStrengthLabel")} 
                  {/* 例: "パスワード強度" */}
                </Text>
                <Progress
                  value={passwordStrengthPercent}
                  size="xs"
                  colorScheme={
                    passwordScore < 2 ? "red" : passwordScore === 2 ? "yellow" : "green"
                  }
                  borderRadius="md"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {passwordStrengthLevels[passwordScore]}
                </Text>
              </Box>
            )}

            {/* パスワード再入力（確認） */}
            <FormControl mb={4} isInvalid={!!confirmPasswordError}>
              <FormLabel fontWeight="bold">
                {t("confirmPasswordLabel")} {/* 例: "パスワード（確認）" */}
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaLock color="gray.400" />
                </InputLeftElement>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("confirmPasswordPlaceholder")} 
                  // "もう一度パスワードを入力"
                  variant="outline"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <InputRightElement>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {confirmPasswordError && (
                <FormErrorMessage>{confirmPasswordError}</FormErrorMessage>
              )}
            </FormControl>

            {/* 名前 */}
            <FormControl mb={6} isInvalid={!!nameError}>
              <FormLabel fontWeight="bold">{t("nameLabel")}</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaUser color="gray.400" />
                </InputLeftElement>
                <Input
                  type="text"
                  placeholder={t("namePlaceholder")} 
                  // 例: "名前を入力"
                  variant="outline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  required
                />
              </InputGroup>
              {nameError && <FormErrorMessage>{nameError}</FormErrorMessage>}
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              w="full"
              isLoading={isLoading}
              size="md"
              boxShadow="md"
            >
              {t("registerButton")} 
              {/* 例: "登録" */}
            </Button>
          </form>

          <Divider my={6} />

          {/* Googleアカウント登録ボタン */}
          <Button
            variant="outline"
            w="full"
            size="md"
            leftIcon={<FaGoogle />}
            isLoading={isLoading}
            onClick={handleGoogleSignup}
            _hover={{ bg: "gray.100" }}
          >
            {t("googleSignupButton")} 
            {/* 例: "Googleで登録" */}
          </Button>

          <Text fontSize="sm" textAlign="center" mt={4} color="gray.700">
            {t("alreadyHaveAccount")}{" "}
            {/* 例: "すでにアカウントをお持ちですか？" */}
            <ChakraLink
              as={NextLink}
              href={`/${locale}/auth/login`}
              color="blue.500"
              textDecoration="underline"
            >
              {t("goToLogin")} 
              {/* 例: "ログインはこちら" */}
            </ChakraLink>
          </Text>
        </MotionBox>
      </Flex>
    </Box>
  );
}
