import "@/app/globals.css";

import Reader from "@/app/Reader/Reader";

export default function Support () {
    const lightStyle = { color: "var(--secondary-text-color)"}

    return (
        <Reader header={true}>
            <div id="support">
                <h1>Support</h1>
                <p>If you have any questions, issues, or need assistance with Thingking, we're here to help! Our support team is dedicated to providing you with the best possible service.</p>
                
                <h2>Contact Support</h2>
                <p>For any support inquiries, please reach out to us at:</p>
                <p><strong>Email:</strong> <a href="mailto:support@thingking.org">support@thingking.org</a></p>

                <br/>
                <h2>Frequently Asked Questions (FAQs)</h2>
                <p>Before reaching out, you might find the answer to your question in our FAQs below:</p>
                <ul>
                    <li><strong>How do I reset my password?</strong> <br/>You can reset your password by clicking on the "Forgot Password" link on the login page and following the instructions.</li>
                    <li><strong>How do I update my account information?</strong> <br/>To update your account information, log into your account and navigate to the "Account Settings" section.</li>
                    <li><strong>How can I delete my account?</strong> <br/>If you wish to delete your account, please contact our support team at <a href="mailto:support@thingking.org">support@thingking.org</a> for assistance.</li>
                    <li><strong>What should I do if I encounter a bug?</strong> <br/>If you encounter a bug or any other technical issue, please report it to our support team with detailed information about the problem and any error messages you received.</li>
                </ul>


                <br/>
                <h2>Support Hours</h2>
                <p>Our support team is available during the following hours:</p>
                <ul>
                    <li><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM (EST)</li>
                    <li><strong>Saturday - Sunday:</strong> Closed</li>
                </ul>

                {/* <h2>Community Support</h2>
                <p>Join our user community to get help from other Thingking users, share tips, and provide feedback:</p>
                <ul>
                    <li><a href="#">Thingking Community Forum</a></li>
                    <li><a href="#">Thingking User Group on Facebook</a></li>
                    <li><a href="#">Thingking Support on Twitter</a></li>
                </ul>

                <h2>Additional Resources</h2>
                <p>For additional resources and guides, please visit our Help Center:</p>
                <ul>
                    <li><a href="#">Help Center</a></li>
                    <li><a href="#">User Guides</a></li>
                    <li><a href="#">Video Tutorials</a></li>
                </ul> */}


                <br/><br/><br/>
                <p>We are committed to ensuring you have a great experience with Thingking. Thank you for choosing us!</p>
            </div>
        </Reader>
    )
}