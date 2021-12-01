1. Create/Restore property within organization 
   1. Property with such address is the only one
      1. There are no other soft deleted properties with such address 
         - connect all residents with such address to this property 
      2. There are other deleted properties with such address
         - connect all residents with such address to this property
   2. There are other non-deleted properties with such address
      1. This porperty is the oldest non-deleted one with such address
         - connect all orphan residents with such address (with no property at all, or currently connected to deleted ones) to this property 
         - NOTE: non-orphan residents with such address (connected to non-deleted properties with such address) will not be reconnected.
      2. This property is younger than other non-deleted property with same address
         - do nothing
2. Soft deleteion of property within organization
   1. It's the only property with such address
      - disconnect all residents from this property (connect to null)
   2. There аre other non-deleted properties with such address
      - reconnect all residents from this property to oldest one
3. Deletion of organization is not handled here, because organizations are not being deleted at all 
   - (deletion of organization will break flows???)
