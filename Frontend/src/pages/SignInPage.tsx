
import { SignIn } from "@clerk/clerk-react";
import { motion } from "framer-motion";

export const SignInPage = () => {
    return (
        <div className="flex items-center justify-center min-h-screen w-full">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10"
            >
                <SignIn
                    appearance={{
                        elements: {
                            card: "bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]",
                            headerTitle: "text-white",
                            headerSubtitle: "text-white/70",
                            formFieldLabel: "text-white/80",
                            formFieldInput: "bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-purple-400 focus:ring-purple-400/20",
                            formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0",
                            footerActionText: "text-white/70",
                            footerActionLink: "text-blue-300 hover:text-blue-200",
                            dividerLine: "bg-white/10",
                            dividerText: "text-white/50",
                            socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
                            socialButtonsBlockButtonText: "text-white",
                            formFieldInputShowPasswordButton: "text-white/70"
                        },
                        layout: {
                            socialButtonsPlacement: "bottom",
                            logoPlacement: "none"
                        }
                    }}
                />
            </motion.div>
        </div>
    );
}
