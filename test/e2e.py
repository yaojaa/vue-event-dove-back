#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, sys, logging, time, urllib, urllib2, simplejson as json
import unittest

BASE = 'http://localhost:9000'

if len(sys.argv) == 2 and sys.argv[1] == 'io':
    BASE = 'http://huitang.io/eventdove/'

elif len(sys.argv) == 2 and sys.argv[1] == 'lo':
    BASE = 'http://localhost:9000'

elif len(sys.argv) == 2 and sys.argv[1] == '5000':
    BASE = 'http://localhost:5000'
    
print 'base ', BASE

class TestAPIServices(unittest.TestCase):
   
    def get(self, url):
        content = urllib2.urlopen(url).read()
        self.assertIsNotNone(content)
        result = json.loads(content)
        return result
    
    def fetch(self, url):
        content = urllib2.urlopen(url).read()
        self.assertIsNotNone(content)
        result = json.loads(content)
        return result
    
    def fetchEventSearch(self, criteria):
        url = BASE + '/event/search?' + criteria
        print url
        return self.fetch(url)
    
    def post(self, url, data):
        req = urllib2.Request(url)
        req.add_header('Content-Type', 'application/json')
        response = urllib2.urlopen(req, data).read()
        print response
        self.assertIsNotNone(response)
        result = json.loads(response)
        return result
    
    def postError(self, url, data, errorCode = 400):
        req = urllib2.Request(url)
        req.add_header('Content-Type', 'application/json')
        
        try : 
            urllib2.urlopen(req, data).read()
        except urllib2.HTTPError, he:
            self.assertEquals(he.code, errorCode)
    
        
    def testAddEvent(self):
         
        f = open('json/createEvent.json')
        data = f.read()
        f.close()
         
        url = '%s/event/create' % (BASE) 
        result = self.post(url, data)
        
        print result
        eventId = result['id']
        
        f = open('json/addAttendee.json')
        data = f.read()
        f.close()
        
        userId = str(10000)
        
        d = json.loads(data)
        d['eventId'] = eventId
        d['userId'] = userId
        
        
        url = '%s/attendee/add' % (BASE) 
        result = self.post(url, json.dumps(d))
        attendeeId = result['id']
        d['id'] = attendeeId 
        
        
        url = '%s/attendee/checkIn' % (BASE) 
        result = self.post(url, json.dumps(d))
        self.assertTrue(result['checkedIn'])
        
        
        url = '%s/event/attendees/%s' % (BASE, eventId) 
        result = self.get(url)
        print '---- attendee ', result, '-------------'
        attendee = result[0]
        self.assertEquals(attendee['eventId'], eventId)
        self.assertEquals(attendee['id'], attendeeId)
        self.assertEquals(attendee['userId'], userId)
        #self.assertTrue(result['checkedIn'])
        
        #url = '%s/event/delete?id=%s' % (BASE, eventId) 
        #result = self.get(url)
        #print '----', result, '-------------'
        
    def testEventValidation(self):
        f = open('json/createInvalidEvent.json')
        data = f.read()
        f.close()
        
        url = '%s/event/create' % (BASE)
        self.postError(url, data)
        
        d = json.loads(data)
        d['start_time'] = None
        d['title'] = 'test'
        data = json.dumps(d)
        print data
        self.postError(url, data)
        
        d['start_time'] = '2016-12-06'
        self.post(url, json.dumps(d))
        
    def testUserValidation(self):
        f = open('json/registerUser.json')
        data = f.read()
        f.close()
        
        d = json.loads(data)
        d['username'] = None
        
        url = '%s/user/register' % (BASE)
        self.postError(url, json.dumps(d))
       
        
        d['username'] = 'test'
        self.post(url, json.dumps(d))
        
    def testRegisterUser(self):
         
        f = open('json/registerUser.json')
        data = f.read()
        f.close()
         
        url = '%s/user/register' % (BASE) 
        result = self.post(url, data)
        
        print result
   
    def testSearchByTitle(self):
        
        params = {"title":'2016中国国际美容美发博览会'}
        result = self.fetchEventSearch(urllib.urlencode(params))
        self.assertEquals(result['count'], 1)
        
    def testLocationSearch(self):
        params = {"location":'31.4821,120.3288'}
        result = self.fetchEventSearch(urllib.urlencode(params))
        self.assertEquals(result['count'], 14)
        
   
        
     
if __name__ == '__main__':
    suite = unittest.TestLoader().loadTestsFromTestCase(TestAPIServices)
    unittest.TextTestRunner(verbosity=2).run(suite)
     
