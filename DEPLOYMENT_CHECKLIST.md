# Deployment Checklist: Tenant Unlink & Kick-Out Feature

Use this checklist when deploying the tenant unlink and kick-out functionality.

---

## ✅ Pre-Deployment Checklist

### Code Review
- [x] All code changes committed
- [x] No linter errors
- [x] Code follows existing patterns
- [x] Error handling implemented
- [x] Validation logic in place
- [x] Authorization checks working
- [x] Comments and documentation added

### Database
- [x] User model updated with unlinkHistory
- [x] Property model updated with tenantRemovalHistory
- [ ] Database migration plan created (if needed)
- [ ] Backup of production database taken

### Testing
- [x] Unit tests written (`testUnlinkKickOut.js`)
- [x] All tests passing locally
- [ ] Tests run on staging environment
- [ ] Edge cases tested
- [ ] Error scenarios validated
- [ ] Authorization checks verified

### Documentation
- [x] API documentation created
- [x] Flow diagrams created
- [x] Quick start guide available
- [x] Implementation summary written
- [ ] Team briefed on new features

---

## 🚀 Deployment Steps

### 1. Staging Environment

- [ ] **Deploy code to staging**
  ```bash
  git checkout main
  git pull origin main
  # Deploy to staging server
  ```

- [ ] **Run automated tests**
  ```bash
  node scripts/testUnlinkKickOut.js
  ```

- [ ] **Manual testing**
  - [ ] Test tenant unlink with valid account
  - [ ] Test tenant unlink when not linked (error case)
  - [ ] Test owner kick-out with valid data
  - [ ] Test owner kick-out without reason (validation)
  - [ ] Test non-owner kick-out attempt (authorization)
  - [ ] Verify notifications are sent
  - [ ] Check database entries created

- [ ] **Verify database state**
  ```javascript
  // Check unlinkHistory
  db.users.findOne({ email: "test@tenant.com" }).unlinkHistory
  
  // Check tenantRemovalHistory
  db.properties.findOne({ name: "Test Property" }).tenantRemovalHistory
  ```

### 2. Production Deployment

- [ ] **Final checklist before production**
  - [ ] All staging tests passed
  - [ ] Code reviewed by team lead
  - [ ] Database backup completed
  - [ ] Rollback plan ready
  - [ ] Monitoring alerts configured

- [ ] **Deploy to production**
  ```bash
  git checkout main
  # Deploy to production server
  # Restart Node.js server
  ```

- [ ] **Smoke tests**
  - [ ] Health check endpoint responding
  - [ ] Existing APIs still working
  - [ ] New endpoints accessible
  - [ ] Authentication working

- [ ] **Monitor logs**
  ```bash
  # Watch for errors
  tail -f logs/error.log
  
  # Watch for usage
  tail -f logs/access.log | grep "tenants/unlink\|tenants/kick-out"
  ```

### 3. Post-Deployment Verification

- [ ] **API endpoints responding**
  ```bash
  # Test unlink endpoint
  curl -X POST https://yourapi.com/api/tenants/unlink \
    -H "Authorization: Bearer TOKEN"
  
  # Test kick-out endpoint
  curl -X POST https://yourapi.com/api/tenants/kick-out \
    -H "Authorization: Bearer TOKEN"
  ```

- [ ] **Database writes working**
  - [ ] Check unlinkHistory entries
  - [ ] Check tenantRemovalHistory entries
  - [ ] Verify linkedProperty cleared
  - [ ] Verify tenants array updated

- [ ] **Notifications working**
  - [ ] Push notifications sent to owners
  - [ ] Push notifications sent to tenants
  - [ ] Notification payload correct

- [ ] **No errors in logs**
  - [ ] Check application logs
  - [ ] Check database logs
  - [ ] Check notification service logs

---

## 📱 Mobile App Coordination

### Before Mobile Release

- [ ] **Backend deployed and verified**
- [ ] **API documentation shared with mobile team**
- [ ] **Test accounts created for mobile testing**
- [ ] **Endpoint URLs confirmed**

### Mobile App Testing

- [ ] **Tenant unlink flow**
  - [ ] UI dialog displays correctly
  - [ ] Reason input works
  - [ ] API call succeeds
  - [ ] Success message shown
  - [ ] Navigation to setup screen
  - [ ] Notification received by owner

- [ ] **Owner kick-out flow**
  - [ ] Tenant list displays
  - [ ] Kick-out dialog displays
  - [ ] Reason input required
  - [ ] API call succeeds
  - [ ] Success message shown
  - [ ] Tenant list refreshed
  - [ ] Notification received by tenant

---

## 🔍 Monitoring Plan

### Metrics to Track

- [ ] **Usage Metrics**
  - Number of unlink requests per day
  - Number of kick-out requests per day
  - Success vs failure rate
  - Average response time

- [ ] **Error Tracking**
  - 400 errors (validation)
  - 403 errors (authorization)
  - 404 errors (not found)
  - 500 errors (server errors)

- [ ] **Business Metrics**
  - Top reasons for unlinking
  - Top reasons for kick-outs
  - Properties with most turnovers
  - Average tenant stay duration

### Alerts to Configure

- [ ] **Critical Alerts**
  - 500 error rate > 1%
  - Notification service down
  - Database connection issues

- [ ] **Warning Alerts**
  - Increased unlink/kick-out rate
  - High validation error rate
  - Authorization failures

---

## 📊 Success Criteria

### Day 1
- [x] No critical errors in logs
- [ ] At least 1 successful unlink tested
- [ ] At least 1 successful kick-out tested
- [ ] Notifications delivered successfully
- [ ] Database entries created correctly

### Week 1
- [ ] No data integrity issues
- [ ] No performance degradation
- [ ] User feedback collected
- [ ] Mobile app integrated successfully
- [ ] Support tickets < 5

### Month 1
- [ ] Feature adoption rate measured
- [ ] Common issues documented
- [ ] Improvements identified
- [ ] Analytics dashboard created

---

## 🔄 Rollback Plan

### If Critical Issues Found

1. **Immediate Actions**
   ```bash
   # Revert to previous deployment
   git revert HEAD
   git push origin main
   # Redeploy previous version
   ```

2. **Disable New Routes (Emergency)**
   ```javascript
   // Comment out in routes/tenantRoutes.js
   // router.post('/unlink', protect, authorize('tenant'), unlinkProperty);
   // router.post('/kick-out', protect, authorize('owner', 'admin'), kickOutTenant);
   ```

3. **Database Cleanup (If Needed)**
   ```javascript
   // Remove test entries
   db.users.updateMany({}, { $unset: { unlinkHistory: "" } })
   db.properties.updateMany({}, { $unset: { tenantRemovalHistory: "" } })
   ```

4. **Communication**
   - [ ] Notify mobile team
   - [ ] Update status page
   - [ ] Post-mortem meeting scheduled

---

## 📞 Support Contacts

### During Deployment

| Role | Name | Contact |
|------|------|---------|
| Backend Lead | [Your Name] | [Email/Phone] |
| DevOps | [Name] | [Email/Phone] |
| Mobile Lead | [Name] | [Email/Phone] |
| Product Manager | [Name] | [Email/Phone] |

### Emergency Contacts

- **On-Call Engineer:** [Phone]
- **Database Admin:** [Phone]
- **System Admin:** [Phone]

---

## 📝 Post-Deployment Tasks

### Documentation
- [ ] Update API changelog
- [ ] Update version number
- [ ] Document any issues found
- [ ] Update runbook

### Communication
- [ ] Notify stakeholders of successful deployment
- [ ] Share metrics with team
- [ ] Announce feature to users (if needed)
- [ ] Update release notes

### Optimization
- [ ] Review performance metrics
- [ ] Identify optimization opportunities
- [ ] Schedule follow-up improvements
- [ ] Collect user feedback

---

## 🎯 Definition of Done

This deployment is considered successful when:

- ✅ All code deployed to production
- ✅ All tests passing
- ✅ Zero critical errors in logs
- ✅ Database writes working correctly
- ✅ Notifications delivered successfully
- ✅ Mobile app successfully integrated
- ✅ Monitoring dashboards configured
- ✅ Team trained on new feature
- ✅ Documentation updated
- ✅ Users can successfully use the feature

---

## 📅 Timeline

| Phase | Duration | Responsible |
|-------|----------|-------------|
| Code Review | 2 hours | Team |
| Staging Deploy | 1 hour | DevOps |
| Staging Testing | 4 hours | QA Team |
| Production Deploy | 1 hour | DevOps |
| Smoke Testing | 1 hour | Backend Team |
| Mobile Testing | 4 hours | Mobile Team |
| **Total** | **13 hours** | **All Teams** |

---

## ✅ Sign-Off

### Approvals Required

- [ ] Backend Team Lead
- [ ] QA Lead
- [ ] Mobile Team Lead
- [ ] Product Manager
- [ ] DevOps Lead

### Deployment Authorized By:

**Name:** ___________________________  
**Date:** ___________________________  
**Time:** ___________________________

---

## 📚 References

- **API Documentation:** `TENANT_UNLINK_KICKOUT_API.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY_UNLINK_KICKOUT.md`
- **Flow Diagrams:** `UNLINK_KICKOUT_FLOW_DIAGRAM.md`
- **Quick Start:** `QUICK_START_UNLINK_KICKOUT.md`
- **Test Script:** `scripts/testUnlinkKickOut.js`

---

**Prepared By:** Development Team  
**Last Updated:** December 2023  
**Version:** 1.0

---

*Use this checklist to ensure a smooth, successful deployment of the tenant unlink and kick-out feature.*

