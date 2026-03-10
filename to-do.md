### **To-Do List**

#### **Website Pages**
1. **Home**
   - Update UI implementation.

2. **About**
   - Update contents.
   - Add in-depth project documentation.

3. **Analytics**
   - Shift to utility user profile.

4. **Dashboard**
   - Make invisible on the navbar until logged in by respective user profiles.

5. **Marketplace**
   - Add dummy marketplace declarations.

6. **Blog**
   - Implement functionality for the blog page.
   - Allow users to create blog posts after logging in.

7. **Pricing**
   - Add to the navbar.
   - Label as "COMING SOON" or use `@pricing.md`.

---

#### **Registration Page**
1. **Password Validation**
   - Prevent registration if the password is not strong.

---

#### **Onboarding (First Login)**
1. **Location**
   - Make location mandatory to proceed.
   - Autofill location based on the user’s IP address.

---

#### **Post-Login**
1. **Redirect**
   - Take the user to the dashboard after login.

---

#### **Prosumer Dashboard**
1. **Live Smart Meter Data Tile**
   - Leave as is for now (future IoT implementation).

2. **Power Backup Tile**
   - Integrate with IoT for fetching capacity.
   - Fetch bought and sold energy from the database.
   - Show wallet balance (fetch energy tokens).

3. **Energy Pricing Tile**
   - Remove or feed with dummy data.
   - Future implementation.

4. **User Profile → Device Info**
   - Add functionality to add a new device.
   - Display grid status (Active/Inactive).

5. **Blockchain Marketplace**
   - Deploy a functional blockchain marketplace.

---

#### **Consumer Dashboard**
1. **Clone Prosumer Dashboard**
   - Replace energy production tile with energy consumption tile.

2. **Marketplace Customizations**
   - Customize marketplace for consumer needs.

---

#### **Grid Dashboard**
1. **Custom Dashboard**
   - Create a custom dashboard for grid management.

2. **Monitor Grid Status**
   - Track overall grid status.

3. **Energy Distribution**
   - Monitor energy distribution across the grid.

4. **AI-Generated Forecast**
   - View AI-generated energy forecasts (XGBoost Model).

5. **Market Analytics**
   - Provide access to market analytics.