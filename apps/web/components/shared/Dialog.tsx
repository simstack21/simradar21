import { TrashIcon, TriangleAlertIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

async function onDeleteAccount() {
	try {
		const res = await fetch("/user", { method: "DELETE" });
		if (!res.ok) throw new Error("Failed to delete account");

		await signOut({ redirect: true, callbackUrl: "/" });
	} catch (err) {
		console.error(err);
		alert("Failed to delete account. Please try again.");
	}
}

export const AlertDialogDeleteAccount = () => {
	return (
		<AlertDialog>
			<AlertDialogTrigger className="flex items-center gap-2">
				<TrashIcon />
				<span>Delete Account</span>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader className="items-center">
					<div className="bg-destructive/10 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
						<TriangleAlertIcon className="text-destructive size-6" />
					</div>
					<AlertDialogTitle className="w-full text-center">Are you absolutely sure you want to delete?</AlertDialogTitle>
					<AlertDialogDescription className="text-center">
						This action cannot be undone. This will permanently delete your account and remove your data from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={onDeleteAccount}
						className="bg-destructive dark:bg-destructive/60 hover:bg-destructive focus-visible:ring-destructive text-white"
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
