import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

import { Database } from "@/types_db";
import { Price, Product } from "@/types";

import { stripe } from "./stripe";
import { toDateTime } from "./helpers";

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * Upserts a product record into the Supabase database using the given Stripe Product object.
 *
 * @param {Stripe.Product} product - the product object to be upserted
 * @return {Promise<void>} a promise that resolves when the upsert is complete
 * @throws {Error} if there was an error during the upsert process
 */
const upsertProductRecord = async (product: Stripe.Product) => {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? undefined,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };

  const { error } = await supabaseAdmin.from("products").upsert([productData]);
  if (error) throw error;
  console.log(`Product inserted/updated: ${product.id}`);
};

/**
 * Upserts a price record to the database.
 *
 * @param {Stripe.Price} price - The price object to be upserted.
 * @return {Promise<void>} Promise resolved with no value upon successful completion.
 * @throws {Error} If there is an error upserting the data to the database.
 */
const upsertPriceRecord = async (price: Stripe.Price) => {
  const priceData: Price = {
    id: price.id,
    product_id: typeof price.product === "string" ? price.product : "",
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? undefined,
    type: price.type,
    unit_amount: price.unit_amount ?? undefined,
    interval: price.recurring?.interval,
    interval_count: price.recurring?.interval_count,
    trial_period_days: price.recurring?.trial_period_days,
    metadata: price.metadata,
  };

  const { error } = await supabaseAdmin.from("prices").upsert([priceData]);
  if (error) throw error;
  console.log(`Price inserted/updated: ${price.id}`);
};

/**
 * Creates or retrieves a customer using their email and UUID. If the customer does not exist,
 * a new customer is created in Stripe and inserted into the Supabase database.
 *
 * @param {Object} param - An object with email and uuid properties.
 * @param {string} param.email - The customer's email.
 * @param {string} param.uuid - The customer's UUID.
 * @return {Promise<string>} The customer's Stripe ID.
 */
const createOrRetrieveCustomer = async ({
  email,
  uuid,
}: {
  email: string;
  uuid: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("stripe_customer_id")
    .eq("id", uuid)
    .single();
  if (error || !data?.stripe_customer_id) {
    const customerData: { metadata: { supabaseUUID: string }; email?: string } =
      {
        metadata: {
          supabaseUUID: uuid,
        },
      };
    if (email) customerData.email = email;
    const customer = await stripe.customers.create(customerData);
    const { error: supabaseError } = await supabaseAdmin
      .from("customers")
      .insert([{ id: uuid, stripe_customer_id: customer.id }]);
    if (supabaseError) throw supabaseError;
    console.log(`New customer created and inserted for ${uuid}.`);
    return customer.id;
  }
  return data.stripe_customer_id;
};

/**
 * Copies billing details from a Stripe payment method to a Supabase user's billing address and payment method.
 *
 * @param {string} uuid - The UUID of the Supabase user to update.
 * @param {Stripe.PaymentMethod} payment_method - The Stripe payment method containing the billing details to copy.
 * @return {Promise<void>} A Promise that resolves when the billing details have been successfully copied.
 */
const copyBillingDetailsToCustomer = async (
  uuid: string,
  payment_method: Stripe.PaymentMethod
) => {
  //Todo: check this assertion
  const customer = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;
  if (!name || !phone || !address) return;
  //@ts-ignore
  await stripe.customers.update(customer, { name, phone, address });
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      billing_address: { ...address },
      payment_method: { ...payment_method[payment_method.type] },
    })
    .eq("id", uuid);
  if (error) throw error;
};

/**
 * Manages the status change of a subscription by retrieving the corresponding customer's UUID from the mapping table using their Stripe customer ID. 
 * 
 * @param {string} subscriptionId - The ID of the subscription to manage.
 * @param {string} customerId - The customer ID of the user associated with the subscription.
 * @param {boolean} createAction=false - Whether or not to create a new subscription.
 * @return {Promise<void>} - Promise that resolves when the function completes.
 */
const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false
) => {
  // Get customer's UUID from mapping table.
  const { data: customerData, error: noCustomerError } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  if (noCustomerError) throw noCustomerError;

  const { id: uuid } = customerData!;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"],
  });
  // Upsert the latest status of the subscription object.
  const subscriptionData: Database["public"]["Tables"]["subscriptions"]["Insert"] =
    {
      id: subscription.id,
      user_id: uuid,
      metadata: subscription.metadata,
      // @ts-ignore
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      //TODO check quantity on subscription
      // @ts-ignore
      quantity: subscription.quantity,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at
        ? toDateTime(subscription.cancel_at).toISOString()
        : null,
      canceled_at: subscription.canceled_at
        ? toDateTime(subscription.canceled_at).toISOString()
        : null,
      current_period_start: toDateTime(
        subscription.current_period_start
      ).toISOString(),
      current_period_end: toDateTime(
        subscription.current_period_end
      ).toISOString(),
      created: toDateTime(subscription.created).toISOString(),
      ended_at: subscription.ended_at
        ? toDateTime(subscription.ended_at).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? toDateTime(subscription.trial_start).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? toDateTime(subscription.trial_end).toISOString()
        : null,
    };

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert([subscriptionData]);
  if (error) throw error;
  console.log(
    `Inserted/updated subscription [${subscription.id}] for user [${uuid}]`
  );

  // For a new subscription copy the billing details to the customer object.
  // NOTE: This is a costly operation and should happen at the very end.
  if (createAction && subscription.default_payment_method && uuid)
    //@ts-ignore
    await copyBillingDetailsToCustomer(
      uuid,
      subscription.default_payment_method as Stripe.PaymentMethod
    );
};

export {
  upsertProductRecord,
  upsertPriceRecord,
  createOrRetrieveCustomer,
  manageSubscriptionStatusChange,
};
