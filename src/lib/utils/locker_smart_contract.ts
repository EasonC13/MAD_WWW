export const locker_smart_contract = `module sui_gives::locker {

  // ---- Module Imports ----
  
  use sui::object::{Self, UID, ID};
  use sui::transfer;
  use sui::tx_context::{Self, TxContext};
  use sui::dynamic_object_field as dof;
  use sui_gives::object_bag::{Self, ObjectBag};
  use sui::event;
  use std::ascii::{String as ASCIIString};
  use sui::bls12381::bls12381_min_pk_verify;
  use std::string::{Self};
  use sui::coin::{Self, Coin};
  use std::type_name;
  use std::option::{Self, Option};
  use std::bcs;

  // ---- Errors ----

  const ENotAuthorized: u64 = 8;
  const ECanNotUseCoinAtThisFunction: u64 = 7;
  const EInvalidBlsSig: u64 = 6;

  // ---- Events ----

  struct AddCoin has copy, drop {
      public_key: vector<u8>,
      lockerContents_id: ID,
      coin_type: ASCIIString,
      balance: u64,
      creator: address,
      unlocker: Option<address>,
      sender: address,
  }

  struct AddObject has copy, drop {
      public_key: vector<u8>,
      lockerContents_id: ID,
      object_type: ASCIIString,
      creator: address,
      unlocker: Option<address>,
      sender: address,
  }

  struct LockerContentsCreated has copy, drop {
      public_key: vector<u8>,
      lockerContents_id: ID,
      creator: address,
      unlocker: Option<address>,
      sender: address,
  }

  struct LockerContentsDeleted has copy, drop {
      public_key: vector<u8>,
      lockerContents_id: ID,
      creator: address,
      unlocker: Option<address>,
      sender: address,
  }

  struct LockerContentsUnlocked has copy, drop {
      msg_vec: vector<u8>,
      bls_signature: vector<u8>,
      public_key: vector<u8>,
      lockerContents_id: ID,
      creator: address,
      unlocker: Option<address>,
      sender: address,
  }

  
  struct RemoveCoin has copy, drop {
      public_key: vector<u8>,
      lockerContents_id: ID,
      coin_type: ASCIIString,
      balance: u64,
      creator: address,
      unlocker: Option<address>,
      sender: address,
  }

  struct RemoveObject has copy, drop {
      public_key: vector<u8>,
      lockerContents_id: ID,
      object_type: ASCIIString,
      creator: address,
      unlocker: Option<address>,
      sender: address,
  }

  // ---- Objects ----

  struct Locker has key {
      id: UID
  }

  struct LockerContents has key, store {
      id: UID,
      bag: ObjectBag,
      creator: address,
      unlocker: Option<address>,
  }

  // ---- Constructor ----

  fun init(ctx: &mut TxContext) {
      create_locker(ctx);
  }

  // ---- Internal Functions ----

  fun create_locker(ctx: &mut TxContext) {
      transfer::share_object(Locker { id: object::new(ctx) })
  }

  fun is_not_coin<T>(): bool {
      let type_string_ascii: ASCIIString = type_name::into_string((type_name::get<T>()));
      let type_string = string::from_ascii(type_string_ascii);
      let type_substring = string::utf8(b"");
      if(string::length(&type_string) > 76){
          type_substring = string::sub_string(&type_string, 0, 76);
      };
      let isCoin = type_substring == string::utf8(
          b"0000000000000000000000000000000000000000000000000000000000000002::coin::Coin"
      );
      !isCoin
  }

  // ---- Public Functions ----

  public fun add_coin<T>(
      locker: &mut Locker,
      public_key: vector<u8>,
      v: Coin<T>, 
      ctx: &TxContext
  ) {
      let contents = dof::borrow_mut<vector<u8>, LockerContents>(&mut locker.id, public_key);
      assert!(contents.creator == tx_context::sender(ctx), ENotAuthorized);

      event::emit(AddCoin {
          public_key,
          lockerContents_id: object::id(contents),
          coin_type: type_name::into_string((type_name::get<T>())),
          balance: coin::value(&v),
          creator: contents.creator,
          unlocker: contents.unlocker,
          sender: tx_context::sender(ctx),
      });

      let index = object_bag::length(&contents.bag);
      object_bag::add(&mut contents.bag, index, v);
  }

  public fun add_object<V: key + store>(
      locker: &mut Locker,
      public_key: vector<u8>,
      v: V,
      ctx: &TxContext
  ) {
      assert!(is_not_coin<V>(), ECanNotUseCoinAtThisFunction);
      let contents = dof::borrow_mut<vector<u8>, LockerContents>(
          &mut locker.id,
          public_key
      );
      assert!(contents.creator == tx_context::sender(ctx), ENotAuthorized);

      event::emit(AddObject {
          public_key,
          lockerContents_id: object::id(contents),
          object_type: type_name::into_string((type_name::get<V>())),
          creator: contents.creator,
          unlocker: contents.unlocker,
          sender: tx_context::sender(ctx),
      });

      let index = object_bag::length(&contents.bag);
      object_bag::add(&mut contents.bag, index, v);
  }

  public fun create_locker_contents(
      locker: &mut Locker,
      creator: address,
      unlocker: Option<address>,
      public_key: vector<u8>,
      ctx: &mut TxContext,
  ) {
      let bag = object_bag::new(ctx);
      let contents = LockerContents {
          id: object::new(ctx),
          bag,
          creator,
          unlocker,
      };

      let lockerContents_id = object::id(&contents);
      event::emit(LockerContentsCreated {
          public_key,
          lockerContents_id,
          creator,
          unlocker,
          sender: tx_context::sender(ctx)
      });

      dof::add(&mut locker.id, public_key, contents);
  }

  public fun delete_locker_contents(
      locker: &mut Locker,
      public_key: vector<u8>,
      ctx: &mut TxContext,
  ) {
      let contents = dof::remove<vector<u8>, LockerContents>(&mut locker.id, public_key);
      let LockerContents { id, bag, creator, unlocker} = contents;
      assert!(
          creator == tx_context::sender(ctx) || 
          *option::borrow(&unlocker) == tx_context::sender(ctx),
          ENotAuthorized
      );

      let lockerContents_id = object::uid_to_inner(&id);
      event::emit(LockerContentsDeleted {
          public_key,
          lockerContents_id,
          creator,
          unlocker,
          sender: tx_context::sender(ctx),
      });
      
      object_bag::destroy_empty(bag);
      object::delete(id);
  }

  public fun lock_exists(
      locker: &Locker,
      public_key: vector<u8>,
  ): bool {
      dof::exists_with_type<vector<u8>, LockerContents>(&locker.id, public_key)
  }

  public fun remove_coin<T>(
      locker: &mut Locker,
      public_key: vector<u8>,
      k: u64,
      ctx: &TxContext
  ): Coin<T> {
      let contents = dof::borrow_mut<vector<u8>, LockerContents>(&mut locker.id, public_key);
      assert!(
          contents.creator == tx_context::sender(ctx) || 
          *option::borrow(&contents.unlocker) == tx_context::sender(ctx),
          ENotAuthorized
      );

      let v = object_bag::remove<Coin<T>>(&mut contents.bag, k);

      event::emit(RemoveCoin {
          public_key,
          lockerContents_id: object::id(contents),
          coin_type: type_name::into_string((type_name::get<T>())),
          balance: coin::value(&v),
          creator: contents.creator,
          unlocker: contents.unlocker,
          sender: tx_context::sender(ctx),
      });
      v
  }

  public fun remove_coin_to<T>(
      locker: &mut Locker,
      public_key: vector<u8>,
      k: u64,
      recipient: address,
      ctx: &TxContext
  ) {
      let coin = remove_coin<T>(locker, public_key, k, ctx);
      transfer::public_transfer(coin, recipient);
  }

  public fun remove_object<V: key + store>(
      locker: &mut Locker,
      public_key: vector<u8>,
      k: u64,
      ctx: &TxContext
  ): V {
      assert!(is_not_coin<V>(), ECanNotUseCoinAtThisFunction);
      let contents = dof::borrow_mut<vector<u8>, LockerContents>(&mut locker.id, public_key);
      assert!(
          contents.creator == tx_context::sender(ctx) || 
          *option::borrow(&contents.unlocker) == tx_context::sender(ctx),
          ENotAuthorized
      );

      let object = object_bag::remove<V>(&mut contents.bag, k);

      event::emit(RemoveObject {
          public_key,
          lockerContents_id: object::id(contents),
          object_type: type_name::into_string((type_name::get<V>())),
          creator: contents.creator,
          unlocker: contents.unlocker,
          sender: tx_context::sender(ctx),
      });

      object
  }

  public fun remove_object_to<V: key + store>(
      locker: &mut Locker,
      public_key: vector<u8>,
      k: u64,
      recipient: address,
      ctx: &TxContext
  ) {
      let object = remove_object<V>(locker, public_key, k, ctx);
      transfer::public_transfer(object, recipient);
  }
  
  public fun unlock(
      locker: &mut Locker,
      bls_signature: vector<u8>,
      public_key: vector<u8>,
      unlocker: address,
      ctx: &mut TxContext,
  ) {
      let msg_vec = bcs::to_bytes(&unlocker);
      assert!(
          bls12381_min_pk_verify(
              &bls_signature, &public_key, &msg_vec,
          ),
          EInvalidBlsSig
      );
      let contents = dof::borrow_mut<vector<u8>, LockerContents>(&mut locker.id, public_key);
      contents.unlocker = option::some(unlocker);

      event::emit(LockerContentsUnlocked {
          msg_vec,
          bls_signature,
          public_key,
          lockerContents_id: object::id(contents),
          creator: contents.creator,
          unlocker: contents.unlocker,
          sender: tx_context::sender(ctx),
      });
  }
}
`;
